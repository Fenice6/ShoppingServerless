export interface ShoppingItem {
  userId: string
  shoppingId: string
  createdAt: string
  name: string
  description?: string
  price: number
  status: number
  attachmentUrl?: string
  buyerId?: string
}
