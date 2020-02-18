import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateShoppingItemRequest } from '../../requests/UpdateShoppingItemRequest'

import { updateShoppingItem } from '../../businessLogic/shoppingItems'
import { createLogger } from '../../utils/logger'

const logger = createLogger('updateShoppingItemLambda')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const shoppingId = event.pathParameters.shoppingId
  const updatedShoppingItem: UpdateShoppingItemRequest = JSON.parse(event.body)

  logger.info(shoppingId);
  logger.info(updatedShoppingItem);

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const newItem = await updateShoppingItem(shoppingId,updatedShoppingItem, jwtToken)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      newItem
    })
  }

}
