import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Space, Card, Typography, Switch, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface PriceOption {
  cost: number;
  type: string;
  isActive: boolean;
  minQuantity: number;
  maxQuantity?: number;
  description?: string;
  currency: string;
}

interface PricingManagerProps {
  value?: PriceOption[];
  onChange?: (prices: PriceOption[]) => void;
  disabled?: boolean;
}

export const PricingManager: React.FC<PricingManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [prices, setPrices] = useState<PriceOption[]>(value);

  const addPrice = () => {
    const newPrice: PriceOption = {
      cost: 0,
      type: '',
      isActive: true,
      minQuantity: 1,
      currency: 'PKR',
    };
    const updatedPrices = [...prices, newPrice];
    setPrices(updatedPrices);
    onChange?.(updatedPrices);
  };

  const removePrice = (index: number) => {
    const updatedPrices = prices.filter((_, i) => i !== index);
    setPrices(updatedPrices);
    onChange?.(updatedPrices);
  };

  const updatePrice = (index: number, field: keyof PriceOption, value: any) => {
    const updatedPrices = [...prices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    setPrices(updatedPrices);
    onChange?.(updatedPrices);
  };

  return (
    <Card title="Pricing Options" size="small">
      {prices.map((price, index) => (
        <Card key={index} size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              <Form.Item label="Type" style={{ margin: 0 }}>
                <Input
                  placeholder="Price type (e.g., Per Night, Per Hour)"
                  value={price.type}
                  onChange={(e) => updatePrice(index, 'type', e.target.value)}
                  disabled={disabled}
                  style={{ width: 200 }}
                />
              </Form.Item>
              
              <Form.Item label="Cost" style={{ margin: 0 }}>
                <InputNumber
                  placeholder="Cost"
                  value={price.cost}
                  onChange={(value) => updatePrice(index, 'cost', value || 0)}
                  disabled={disabled}
                  min={0}
                  style={{ width: 120 }}
                />
              </Form.Item>

              <Form.Item label="Currency" style={{ margin: 0 }}>
                <Input
                  placeholder="PKR"
                  value={price.currency}
                  onChange={(e) => updatePrice(index, 'currency', e.target.value)}
                  disabled={disabled}
                  style={{ width: 80 }}
                />
              </Form.Item>
            </Space>

            <Space wrap>
              <Form.Item label="Min Quantity" style={{ margin: 0 }}>
                <InputNumber
                  value={price.minQuantity}
                  onChange={(value) => updatePrice(index, 'minQuantity', value || 1)}
                  disabled={disabled}
                  min={1}
                  style={{ width: 100 }}
                />
              </Form.Item>

              <Form.Item label="Max Quantity" style={{ margin: 0 }}>
                <InputNumber
                  value={price.maxQuantity}
                  onChange={(value) => updatePrice(index, 'maxQuantity', value)}
                  disabled={disabled}
                  min={1}
                  style={{ width: 100 }}
                  placeholder="Optional"
                />
              </Form.Item>

              <Form.Item label="Active" style={{ margin: 0 }}>
                <Switch
                  checked={price.isActive}
                  onChange={(checked) => updatePrice(index, 'isActive', checked)}
                  disabled={disabled}
                />
              </Form.Item>

              {!disabled && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removePrice(index)}
                />
              )}
            </Space>

            <Form.Item label="Description" style={{ margin: 0 }}>
              <Input.TextArea
                placeholder="Optional description"
                value={price.description}
                onChange={(e) => updatePrice(index, 'description', e.target.value)}
                disabled={disabled}
                rows={2}
              />
            </Form.Item>
          </Space>
        </Card>
      ))}

      {!disabled && (
        <Button
          type="dashed"
          onClick={addPrice}
          icon={<PlusOutlined />}
          style={{ width: '100%' }}
        >
          Add Price Option
        </Button>
      )}

      {prices.length > 0 && (
        <Divider />
      )}

      {prices.length > 0 && (
        <div>
          <Title level={5}>Active Pricing Summary</Title>
          {prices
            .filter(p => p.isActive)
            .map((price, index) => (
              <Text key={index} style={{ display: 'block', marginBottom: 8 }}>
                {price.type}: {price.currency} {price.cost.toLocaleString()}
                {price.description && ` - ${price.description}`}
              </Text>
            ))}
        </div>
      )}
    </Card>
  );
}; 