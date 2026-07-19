import Button from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary','secondary','danger','ghost','outline'] },
    size: { control: 'select', options: ['sm','md','lg'] },
    loading: { control: 'boolean' },
  },
};

export const Primary = { args: { children: 'Primary Button', variant: 'primary' } };
export const Secondary = { args: { children: 'Secondary', variant: 'secondary' } };
export const Danger = { args: { children: 'Danger', variant: 'danger' } };
export const Loading = { args: { children: 'Loading', loading: true } };
export const Small = { args: { children: 'Small', size: 'sm' } };
export const Large = { args: { children: 'Large', size: 'lg' } };
