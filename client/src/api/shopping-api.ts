import { apiEndpoint } from '../config'
import { ShoppingItem } from '../types/ShoppingItem';
import { CreateShoppingItemRequest } from '../types/CreateShoppingItemRequest';
import Axios from 'axios'
import { UpdateShoppingItemRequest } from '../types/UpdateShoppingItemRequest';

export async function getVisibleShoppingItems(idToken: string): Promise<ShoppingItem[]> {
  console.log('Fetching visible shopping items')

  const response = await Axios.get(`${apiEndpoint}/shoppingItems`, {
    headers: {
      'Content-Type': 'application/json'
    },
  })
  console.log('ShoppingItems:', response.data)
  return response.data.items
}

export async function getShoppingItemsOfUser(idToken: string): Promise<ShoppingItem[]> {
  console.log('Fetching visible shopping items')

  const response = await Axios.get(`${apiEndpoint}/shoppingItemsOfUser`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('ShoppingItems:', response.data)
  return response.data.items
}

export async function createShoppingItem(
  idToken: string,
  newShoppingItem: CreateShoppingItemRequest
): Promise<ShoppingItem> {
  const response = await Axios.post(`${apiEndpoint}/shoppingItem`,  JSON.stringify(newShoppingItem), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.item
}

export async function patchShoppingItem(
  idToken: string,
  shoppingId: string,
  updatedShoppingItem: UpdateShoppingItemRequest
): Promise<void> {
  await Axios.patch(`${apiEndpoint}/shoppingItem/${shoppingId}`, JSON.stringify(updatedShoppingItem), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}