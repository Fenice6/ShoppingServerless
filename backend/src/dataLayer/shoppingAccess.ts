import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk' //xray sdk
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS) //xray sdk instance
const s3 = new XAWS.S3({ //S3 for image Item
  signatureVersion: 'v4'
})

import { ShoppingItem } from '../models/ShoppingItem'
import { ShoppingItemStatusEnum } from '../models/enums/ShoppingItemStatusEnum'

export class ShoppingAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(), //to use dynamoDB
        private readonly shopItemsTable = process.env.SHOP_ITEMS_TABLE, //name of table for shopping items
        private readonly userIndex = process.env.USER_ID_INDEX, //index name for user
        private readonly shoppingItemIdIndex = process.env.SHOPPING_ITEM_ID_INDEX, //index id
        private readonly statusIndex = process.env.STATUS_INDEX,
        private readonly bucketName = process.env.SHOPPING_S3_BUCKET, //baket name
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) { //when url expire
      }
    
      async createShoppingItem(shoppingItem: ShoppingItem): Promise<ShoppingItem> {
        console.log("Starting createShoppingItem");
        await this.docClient.put({
          TableName: this.shopItemsTable,
          Item: shoppingItem
        }).promise()
        console.log("Completed createShoppingItem");
        return shoppingItem
      }

      async getShoppingItemsByUserId(userId: string): Promise<ShoppingItem[]> {
        console.log("Starting getSoppingItemsByUserId");
        const result = await this.docClient.query({
          TableName: this.shopItemsTable,
          IndexName: this.userIndex,
          KeyConditionExpression: '#k = :uId ',
          ExpressionAttributeNames: {'#k' : 'userId'},
          ExpressionAttributeValues:{':uId' : userId}
        }).promise()
        console.log("Completed getSoppingItemsByUserId");
        console.log("Found " + result.Count + " elements");
        const items = result.Items
        console.log(items);
        return items as ShoppingItem[]
      }

      async getShoppingItemById(key: any): Promise<ShoppingItem> {
        console.log("Starting getShoppingItemById");
        const result = await this.docClient.query({
          TableName: this.shopItemsTable,
          IndexName: this.shoppingItemIdIndex,
          KeyConditionExpression: '#k = :id ',
          ExpressionAttributeNames: {'#k' : 'shoppingId'},
          ExpressionAttributeValues:{':id' : key.shoppingId}
        }).promise()
        console.log("Completed getShoppingItemById");
        console.log("Found " + result.Count + " element (it must be unique)");
        if (result.Count == 0)
          throw new Error('Element not found')
        if (result.Count > 1)
          throw new Error('shoppingId is not Unique')
        const item = result.Items[0]
        console.log(item);
        return item as ShoppingItem
      }

      async getVisibleShoppingItems(): Promise<ShoppingItem[]> {
        console.log("Starting getVisibleShoppingItems");
        const result = await this.docClient.query({
          TableName: this.shopItemsTable,
          IndexName: this.statusIndex,
          KeyConditionExpression: '#s = :val ',
          ExpressionAttributeNames: {'#s' : 'status'},
          ExpressionAttributeValues:{':val' : ShoppingItemStatusEnum.Available}
        }).promise()
        console.log("Completed getVisibleShoppingItems");
        console.log("Found " + result.Count + " elements");
        const items = result.Items
        console.log(items);
        return items as ShoppingItem[]
      }

      async updateShoppingItem(key: any, toUpdate: any): Promise<ShoppingItem> {
        console.log("Starting updateShoppingItem" );
        const res = await this.docClient.update({
          TableName: this.shopItemsTable,
          Key: key,
          UpdateExpression: 'set #n = :n, #d = :d, #p = :p, #s = :s',
          //ConditionExpression: '#a < :MAX',
          ExpressionAttributeNames: {'#n' : 'name', '#d' : 'description', '#p' : 'price', '#s' : 'status' },
          ExpressionAttributeValues:{
            ':n' : toUpdate.name,
            ':d' : toUpdate.description,
            ':p' : toUpdate.price,
            ':s' : toUpdate.status
          },
          ReturnValues: "ALL_NEW" //All attribute of element
        }).promise()
        console.log("Completed updateShoppingItem");
    
        return res.$response.data as ShoppingItem
      }

      async updateUrlOnShoppingItem(key: any): Promise<ShoppingItem> {
        console.log("Starting updateUrlOnShoppingItem" );
        const res = await this.docClient.update({
          TableName: this.shopItemsTable,
          Key: key,
          UpdateExpression: 'set #u = :u',
          //ConditionExpression: '#a < :MAX',
          ExpressionAttributeNames: {'#u' : 'attachmentUrl'},
          ExpressionAttributeValues:{
            ':u' : `https://${this.bucketName}.s3.amazonaws.com/${key.shoppingId}`
          },
          ReturnValues: "ALL_NEW" //All attribute of element
        }).promise()
        console.log("Completed updateUrlOnShoppingItem");
    
        return res.$response.data as ShoppingItem
      }

      async getUploadUrl(shoppingId: string): Promise<string> {
        console.log("Starting getUploadUrl");
        const ret = await s3.getSignedUrl('putObject', {
          Bucket: this.bucketName,
          Key: shoppingId,
          Expires: parseInt(this.urlExpiration) //operatore unario per essere sicuro venga castato a numero
        })
        console.log("Completed getUploadUrl");
        return ret
      }

      async deleteImageS3(shoppingId: string): Promise<boolean> {
        console.log("Starting deleteImageS3");
        await s3.deleteObject({
          Bucket: this.bucketName,
          Key: shoppingId
        })
        console.log("Completed deleteImageS3");
        return true
      }

      async getImageS3(shoppingId: string): Promise<any> {
        console.log("Starting getImageS3");
        const ret =  await s3.getObject({
          Bucket: this.bucketName,
          Key: shoppingId
        })
        console.log("Completed getImageS3");
        return ret
      }
    
      async deleteShoppingItem(element: ShoppingItem): Promise<boolean> {
        console.log("Starting deleteShoppingItem");
        if(await this.getImageS3(element.shoppingId))
          await this.deleteImageS3(element.shoppingId)
        const result = await this.docClient.delete({
          TableName: this.shopItemsTable,
          Key:
          {
            shoppingId: element.shoppingId,
            createdAt: element.createdAt
          }
        }).promise()
        console.log("Completed deleteShoppingItem");
        if (result.$response.error)
        {
          console.error(result.$response.error)
          return false
        }
        return true
      }

}
function createDynamoDBClient() { //check if we are using offline mode with environment variable
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    AWSXRay.setContextMissingStrategy("LOG_ERROR"); 
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}