import * as uuid from 'uuid'

import { ShoppingItem } from '../models/ShoppingItem'
import { ShoppingItemStatusEnum } from '../models/enums/ShoppingItemStatusEnum'
import { ShoppingAccess } from '../dataLayer/shoppingAccess'
import { CreateShoppingItemRequest } from '../requests/CreateShoppingItemRequest'
import { UpdateShoppingItemRequest } from '../requests/UpdateShoppingItemRequest'
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
      status: ShoppingItemStatusEnum.Available
    })
  }
  

  export async function getAllShoppingItemsOfUser(jwtToken: string): Promise<ShoppingItem[]> {

    const userId = parseUserId(jwtToken)
  
    return shoppingAccess.getShoppingItemsByUserId(userId)
  }
  
  export async function getAllVisibleShoppingItems(): Promise<ShoppingItem[]> {
  
    return shoppingAccess.getVisibleShoppingItems();
  }

  export async function updateShoppingItem(
    shoppingId: string,
    updateShoppingItemRequest: UpdateShoppingItemRequest,
    jwtToken: string
  ): Promise<ShoppingItem> {
  
    parseUserId(jwtToken)
    
    const element = await shoppingAccess.getShoppingItemById({shoppingId: shoppingId})
  
    if( element.status === ShoppingItemStatusEnum.Sold )
      throw new Error("Can't update a sold item")

    var status
    if(updateShoppingItemRequest.hidden)
      status = ShoppingItemStatusEnum.Hidden
    else
      if(updateShoppingItemRequest.hidden === false)
        status = ShoppingItemStatusEnum.Available
      else
        status = element.status
    if(updateShoppingItemRequest.description === undefined)
      updateShoppingItemRequest.description=element.description


    const res = await shoppingAccess.updateShoppingItem(
    { //Key
      shoppingId: shoppingId,
      createdAt: element.createdAt
    },
    { //To Update
      name: updateShoppingItemRequest.name,
      description: updateShoppingItemRequest.description,
      price: updateShoppingItemRequest.price,
      status: status
    })
    return res
  }

  export async function generateUploadUrl(
    shoppingId: string,
    jwtToken: string
  ): Promise<any> {
  
    parseUserId(jwtToken)
    
    const element = await shoppingAccess.getShoppingItemById({shoppingId: shoppingId})

  
    const uploadUrl = await shoppingAccess.getUploadUrl(shoppingId)
    const res = await shoppingAccess.updateUrlOnShoppingItem
    (
      { //Key
        shoppingId: shoppingId,
        createdAt: element.createdAt
      }
    )
    console.log(JSON.stringify(res))
    return {newShoppingItem: res, uploadUrl: uploadUrl}
  
  }

  export async function deleteShoppingItem(
    shoppingId: string,
    jwtToken: string
  ): Promise<boolean> {
  
    parseUserId(jwtToken)
    
    const element = await shoppingAccess.getShoppingItemById({shoppingId: shoppingId})
  
    return await shoppingAccess.deleteShoppingItem(element)
  
  }

  export async function buyShoppingItem(
    shoppingId: string,
    jwtToken: string
  ): Promise<ShoppingItem> {
  
    const userId = parseUserId(jwtToken)

    const element = await shoppingAccess.getShoppingItemById({shoppingId: shoppingId})
  
    return await shoppingAccess.setBuyerToItem(element,userId)
  
  }