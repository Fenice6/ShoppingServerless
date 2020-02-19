import { apiEndpoint } from '../config'
import { ShoppingItem } from '../types/ShoppingItem';
import Axios from 'axios'

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