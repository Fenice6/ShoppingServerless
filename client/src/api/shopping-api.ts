import { apiEndpoint } from '../config'
import { ShoppingItem } from '../types/ShoppingItem';
import { CreateShoppingItemRequest } from '../types/CreateShoppingItemRequest';
import Axios from 'axios'
import { UpdateShoppingItemRequest } from '../types/UpdateShoppingItemRequest';

export async function getVisibleShoppingItems(): Promise<ShoppingItem[]> {
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
  if(newShoppingItem.price < 0)
    throw new Error("Price not valid")
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

export async function deleteShoppingItem(
  idToken: string,
  shoppingId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/shoppingItem/${shoppingId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function getUploadUrl(
  idToken: string,
  shoppingId: string
): Promise<string> {
  const response = await Axios.post(`${apiEndpoint}/shoppingItem/${shoppingId}/attachment`, '', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.uploadUrl
}

export async function uploadFile(uploadUrl: string, file: Buffer): Promise<void> {
  await Axios.put(uploadUrl, file)
}

export async function buyShoppingItem(
  idToken: string,
  shoppingId: string
  ): Promise<ShoppingItem> {
    const response = await Axios.post(`${apiEndpoint}/shoppingItem/${shoppingId}/buy`, '', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    })
    return response.data.result
  }