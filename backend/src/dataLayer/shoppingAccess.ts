import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk' //xray sdk
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS) //xray sdk instance
const s3 = new XAWS.S3({ //S3 for image Item
  signatureVersion: 'v4'
})

import { ShoppingItem } from '../models/ShoppingItem'
import { ShoppingItemStatusEnum } from '../models/enums/ShoppingItemStatusEnum'
import { createLogger } from '../utils/logger'

const logger = createLogger('dataLayer-shoppingAccess')

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
        logger.info("Starting createShoppingItem");
        await this.docClient.put({
          TableName: this.shopItemsTable,
          Item: shoppingItem
        }).promise()
        logger.info("Completed createShoppingItem");
        return shoppingItem
      }

      async getShoppingItemsByUserId(userId: string): Promise<ShoppingItem[]> {
        logger.info("Starting getSoppingItemsByUserId");
        const result = await this.docClient.query({
          TableName: this.shopItemsTable,
          IndexName: this.userIndex,
          KeyConditionExpression: '#k = :uId ',
          ExpressionAttributeNames: {'#k' : 'userId'},
          ExpressionAttributeValues:{':uId' : userId}
        }).promise()
        logger.info("Completed getSoppingItemsByUserId");
        logger.info("Found " + result.Count + " elements");
        const items = result.Items
        logger.info(items);
        return items as ShoppingItem[]
      }

      async getShoppingItemById(key: any): Promise<ShoppingItem> {
        logger.info("Starting getShoppingItemById");
        const result = await this.docClient.query({
          TableName: this.shopItemsTable,
          IndexName: this.shoppingItemIdIndex,
          KeyConditionExpression: '#k = :id ',
          ExpressionAttributeNames: {'#k' : 'shoppingId'},
          ExpressionAttributeValues:{':id' : key.shoppingId}
        }).promise()
        logger.info("Completed getShoppingItemById");
        logger.info("Found " + result.Count + " element (it must be unique)");
        if (result.Count == 0)
          throw new Error('Element not found')
        if (result.Count > 1)
          throw new Error('shoppingId is not Unique')
        const item = result.Items[0]
        logger.info(item);
        return item as ShoppingItem
      }

      async getVisibleShoppingItems(): Promise<ShoppingItem[]> {
        logger.info("Starting getVisibleShoppingItems")
        const result = await this.docClient.query({
          TableName: this.shopItemsTable,
          IndexName: this.statusIndex,
          KeyConditionExpression: '#s = :val ',
          ExpressionAttributeNames: {'#s' : 'status'},
          ExpressionAttributeValues:{':val' : ShoppingItemStatusEnum.Available}
        }).promise()
        logger.info("Completed getVisibleShoppingItems")
        logger.info("Found " + result.Count + " elements")
        const items = result.Items
        logger.info(items);
        return items as ShoppingItem[]
      }

      async updateShoppingItem(key: any, toUpdate: any): Promise<ShoppingItem> {
        logger.info("Starting updateShoppingItem" );
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
        logger.info("Completed updateShoppingItem");
    
        return res.$response.data as ShoppingItem
      }

      async updateUrlOnShoppingItem(key: any): Promise<ShoppingItem> {
        logger.info("Starting updateUrlOnShoppingItem" );
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
        logger.info("Completed updateUrlOnShoppingItem");
    
        return res.$response.data as ShoppingItem
      }

      async getUploadUrl(shoppingId: string): Promise<string> {
        logger.info("Starting getUploadUrl");
        const ret = await s3.getSignedUrl('putObject', {
          Bucket: this.bucketName,
          Key: shoppingId,
          Expires: parseInt(this.urlExpiration) //operatore unario per essere sicuro venga castato a numero
        })
        logger.info("Completed getUploadUrl");
        return ret
      }

      async deleteImageS3(shoppingId: string): Promise<boolean> {
        logger.info("Starting deleteImageS3");
        await s3.deleteObject({
          Bucket: this.bucketName,
          Key: shoppingId
        })
        logger.info("Completed deleteImageS3");
        return true
      }

      async getImageS3(shoppingId: string): Promise<any> {
        logger.info("Starting getImageS3");
        const ret =  await s3.getObject({
          Bucket: this.bucketName,
          Key: shoppingId
        })
        logger.info("Completed getImageS3");
        return ret
      }
    
      async deleteShoppingItem(element: ShoppingItem): Promise<boolean> {
        logger.info("Starting deleteShoppingItem");
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
        logger.info("Completed deleteShoppingItem");
        if (result.$response.error)
        {
          logger.error(result.$response.error)
          return false
        }
        return true
      }

      async setBuyerToItem(element: ShoppingItem, userId: string ): Promise<ShoppingItem> {
        logger.info("Starting setBuyerToItem");
        const res = await this.docClient.update({
          TableName: this.shopItemsTable,
          Key: 
          {
            shoppingId: element.shoppingId,
            createdAt: element.createdAt
          },
          UpdateExpression: 'set #s = :s, #b = :b',
          //ConditionExpression: '#a < :MAX',
          ExpressionAttributeNames: {'#s' : 'status', '#b' : 'buyerId'},
          ExpressionAttributeValues:{
            ':s' : ShoppingItemStatusEnum.Sold,
            ':b' : userId
          },
          ReturnValues: "ALL_NEW" //All attribute of element
        }).promise()
        logger.info("Completed setBuyerToItem");
        
        return res.$response.data as ShoppingItem
      }

}
function createDynamoDBClient() { //check if we are using offline mode with environment variable
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    AWSXRay.setContextMissingStrategy("LOG_ERROR"); 
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}