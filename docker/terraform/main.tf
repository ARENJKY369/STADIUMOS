# FIFA World Cup 2026 - AWS Infrastructure as Code (Terraform)
# Production-ready VPC, RDS, ElastiCache, EC2 ASG, ALB, CloudFront
# Target: 100K+ concurrent users, 99.9% uptime

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "fifa2026-terraform-state"
    key    = "stadium-ops/production/terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt = true
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "stadium-operations"
      Tournament  = "FIFA World Cup 2026"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

variable "region" { default = "us-east-1" }
variable "environment" { default = "production" }
variable "vpc_cidr" { default = "10.0.0.0/16" }
variable "az_count" { default = 3 }

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "stadium-ops-vpc-${var.environment}" }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "stadium-ops-igw-${var.environment}" }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "stadium-ops-public-${count.index}-${var.environment}", Tier = "public" }
}

# Private Subnets (App)
resource "aws_subnet" "private_app" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + var.az_count)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "stadium-ops-private-app-${count.index}-${var.environment}", Tier = "private-app" }
}

# Private Subnets (DB)
resource "aws_subnet" "private_db" {
  count             = var.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + var.az_count*2)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "stadium-ops-private-db-${count.index}-${var.environment}", Tier = "private-db" }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count  = var.az_count
  domain = "vpc"
  tags = { Name = "stadium-ops-nat-eip-${count.index}" }
}

resource "aws_nat_gateway" "main" {
  count         = var.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags = { Name = "stadium-ops-nat-${count.index}" }
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "stadium-ops-rt-public" }
}

resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private_app" {
  count  = var.az_count
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  tags = { Name = "stadium-ops-rt-private-app-${count.index}" }
}

resource "aws_route_table_association" "private_app" {
  count          = var.az_count
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "stadium-ops-alb-${var.environment}"
  description = "ALB security group"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name        = "stadium-ops-app-${var.environment}"
  description = "App servers"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db" {
  name        = "stadium-ops-db-${var.environment}"
  description = "Database"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "stadium-ops-db-subnet-${var.environment}"
  subnet_ids = aws_subnet.private_db[*].id
  tags = { Name = "stadium-ops-db-subnet" }
}

# RDS Parameter Group for PostGIS
resource "aws_db_parameter_group" "postgres" {
  name   = "stadium-ops-postgres15-${var.environment}"
  family = "postgres15"
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
}

# RDS PostgreSQL Multi-AZ
resource "aws_db_instance" "postgres" {
  identifier              = "stadium-ops-postgres-${var.environment}"
  engine                  = "postgres"
  engine_version          = "15.4"
  instance_class          = "db.r6g.large"
  allocated_storage       = 100
  max_allocated_storage   = 500
  storage_type            = "gp3"
  storage_encrypted       = true
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.db.id]
  parameter_group_name    = aws_db_parameter_group.postgres.name
  multi_az                = true
  db_name                 = "stadium_ops"
  username                = "stadium_user"
  manage_master_user_password = true
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  deletion_protection     = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "stadium-ops-final-${var.environment}-${formatdate("YYYY-MM-DD-hh-mm", timestamp())}"
  performance_insights_enabled = true
  monitoring_interval     = 60
  monitoring_role_arn     = aws_iam_role.rds_monitoring.arn
  tags = { Name = "stadium-ops-postgres-${var.environment}" }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis" {
  name       = "stadium-ops-redis-subnet-${var.environment}"
  subnet_ids = aws_subnet.private_db[*].id
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "stadium-ops-redis-${var.environment}"
  description                = "Stadium Ops Redis cluster"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.r6g.large"
  num_cache_clusters         = 2
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.db.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

# ALB
resource "aws_lb" "main" {
  name               = "stadium-ops-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  enable_deletion_protection = true
  tags = { Name = "stadium-ops-alb" }
}

resource "aws_lb_target_group" "backend" {
  name     = "stadium-backend-${var.environment}"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }
}

resource "aws_lb_target_group" "frontend" {
  name     = "stadium-frontend-${var.environment}"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    path = "/"
    matcher = "200"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
  condition {
    path_pattern { values = ["/api/*", "/socket.io/*", "/health*"] }
  }
}

# Auto Scaling Group
resource "aws_launch_template" "app" {
  name_prefix   = "stadium-ops-app-${var.environment}-"
  image_id      = "ami-0abcdef1234567890" # Amazon Linux 2023 with Docker
  instance_type = "c5.xlarge"
  key_name      = "stadium-ops-key"

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
  }))

  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 50
      volume_type = "gp3"
      encrypted   = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = { Name = "stadium-ops-app-${var.environment}" }
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "stadium-ops-asg-${var.environment}"
  vpc_zone_identifier = aws_subnet.private_app[*].id
  target_group_arns   = [aws_lb_target_group.backend.arn, aws_lb_target_group.frontend.arn]
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3
  health_check_type   = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "stadium-ops-app-${var.environment}"
    propagate_at_launch = true
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      checkpoint_delay       = 600
      checkpoint_percentages = [35, 70, 100]
      instance_warmup        = 300
      min_healthy_percentage = 50
    }
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "cpu_up" {
  name                   = "stadium-ops-cpu-up-${var.environment}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "stadium-ops-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70
  dimensions = { AutoScalingGroupName = aws_autoscaling_group.app.name }
  alarm_actions = [aws_autoscaling_policy.cpu_up.arn]
}

# IAM Roles
resource "aws_iam_role" "app" {
  name = "stadium-ops-app-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
    }]
  })
  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"]
}

resource "aws_iam_instance_profile" "app" {
  name = "stadium-ops-app-profile-${var.environment}"
  role = aws_iam_role.app.name
}

# CloudFront
resource "aws_cloudfront_distribution" "main" {
  enabled = true
  aliases = ["stadiumops.fifa2026.com"]

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "stadium-ops-alb"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "stadium-ops-alb"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id  = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled for API
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }

  tags = { Name = "stadium-ops-cf-${var.environment}" }
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  domain_name       = "stadiumops.fifa2026.com"
  validation_method = "DNS"
  subject_alternative_names = ["*.stadiumops.fifa2026.com", "api.stadiumops.fifa2026.com"]
}

# S3 Buckets
resource "aws_s3_bucket" "assets" {
  bucket = "stadium-ops-assets-${var.environment}-${data.aws_caller_identity.current.account_id}"
  tags = { Name = "stadium-ops-assets" }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id
  versioning_configuration { status = "Enabled" }
}

# Outputs
output "alb_dns" { value = aws_lb.main.dns_name }
output "rds_endpoint" { value = aws_db_instance.postgres.endpoint }
output "redis_endpoint" { value = aws_elasticache_replication_group.redis.primary_endpoint_address }
output "cloudfront_domain" { value = aws_cloudfront_distribution.main.domain_name }
