import * as uuid from 'uuid'

import { ShoppingItem } from '../models/ShoppingItem'
import { ShoppingAccess } from '../dataLayer/shoppingAccess'
import { CreateShoppingItemRequest } from '../requests/CreateShoppingItemRequest'
import { parseUserId } from '../auth/utils'

const shoppingAccess = new ShoppingAccess() //to access datas


export async function createShoppingItem(
    createShoppingItemRequest: CreateShoppingItemRequest,
    jwtToken: string
  ): Promise<ShoppingItem> {
  
    const itemId = uuid.v4()
    const userId = parseUserId(jwtToken)
  
    return await shoppingAccess.createShoppingItem({
      shoppingId: itemId,
      userId: userId,
      name: createShoppingItemRequest.name,
      price: createShoppingItemRequest.price,
      description: ((createShoppingItemRequest.description)?createShoppingItemRequest.description : null),
      createdAt: new Date().toISOString(),
      status: 0
    })
  }

  export async function getAllShoppingItemsOfUser(jwtToken: string): Promise<ShoppingItem[]> {

    const userId = parseUserId(jwtToken)
  
    return shoppingAccess.getShoppingItemsByUserId(userId)
  }
  
  export async function getAllVisibleShoppingItems(): Promise<ShoppingItem[]> {
  
    return shoppingAccess.getVisibleShoppingItems();
  }