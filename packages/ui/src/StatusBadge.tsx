import React from 'react';
import { Badge } from './Badge';
import type { OrderStatus, PaymentStatus, AvailabilityState, ProductStatus } from '@marketplace/types';

export interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | AvailabilityState | ProductStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  switch (status) {
    // Availability States
    case 'IN_STOCK':
      return <Badge variant="success" className={className}>Còn hàng</Badge>;
    case 'LOW_STOCK':
      return <Badge variant="warning" className={className}>Sắp hết hàng</Badge>;
    case 'OUT_OF_STOCK':
      return <Badge variant="danger" className={className}>Hết hàng</Badge>;
    case 'PRE_ORDER':
      return <Badge variant="info" className={className}>Đặt trước (Pre-order)</Badge>;
    case 'COMING_SOON':
      return <Badge variant="purple" className={className}>Sắp ra mắt</Badge>;

    // Payment States
    case 'PENDING':
      return <Badge variant="warning" className={className}>Chờ thanh toán</Badge>;
    case 'PAID':
      return <Badge variant="success" className={className}>Đã thanh toán</Badge>;
    case 'FAILED':
      return <Badge variant="danger" className={className}>Thanh toán lỗi</Badge>;
    case 'EXPIRED':
      return <Badge variant="default" className={className}>Hết hạn thanh toán</Badge>;

    // Order States
    case 'PENDING_PAYMENT':
      return <Badge variant="warning" className={className}>Chờ thanh toán</Badge>;
    case 'PROCESSING':
      return <Badge variant="info" className={className}>Đang xử lý</Badge>;
    case 'READY_TO_SHIP':
      return <Badge variant="purple" className={className}>Chờ lấy hàng</Badge>;
    case 'SHIPPING':
      return <Badge variant="info" className={className}>Đang vận chuyển</Badge>;
    case 'DELIVERED':
      return <Badge variant="success" className={className}>Đã giao hàng</Badge>;
    case 'COMPLETED':
      return <Badge variant="success" className={className}>Hoàn thành</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger" className={className}>Đã hủy</Badge>;
    case 'RETURN_REQUESTED':
      return <Badge variant="warning" className={className}>Yêu cầu trả hàng</Badge>;
    case 'RETURNED':
    case 'REFUNDED':
      return <Badge variant="default" className={className}>Đã hoàn tiền</Badge>;

    // Product Statuses
    case 'ACTIVE':
      return <Badge variant="success" className={className}>Đang bán</Badge>;
    case 'PENDING_REVIEW':
      return <Badge variant="warning" className={className}>Chờ duyệt</Badge>;
    case 'REJECTED':
      return <Badge variant="danger" className={className}>Từ chối</Badge>;
    case 'DRAFT':
      return <Badge variant="default" className={className}>Bản nháp</Badge>;
    case 'HIDDEN':
      return <Badge variant="default" className={className}>Đã ẩn</Badge>;

    default:
      return <Badge variant="default" className={className}>{status}</Badge>;
  }
};
