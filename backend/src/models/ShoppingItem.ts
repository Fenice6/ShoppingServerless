export interface ShoppingItem {
  userId: string
  shoppingId: string
  createdAt: string
  name: string
  description?: string
  price: number
  hide: boolean
  attachmentUrl?: string
  buyerId?: string
}
