export interface UpdateShoppingItemRequest {
  name: string
  description?: string
  price: number
  hidden?: boolean
}