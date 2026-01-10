export type AttachmentType =
  | 'toy_list'
  | 'single_toy'
  | 'order_toy'
  | 'reservation_toy'
  | 'reserve_entire_order'
  | 'categories'
  | 'open_toy_details';

export interface MessageModel {
  type: 'user' | 'bot' | 'error';
  text?: string;
  custom?: {
    attachment?: {
      type: AttachmentType;
      data?: any;
    };
  };
}
