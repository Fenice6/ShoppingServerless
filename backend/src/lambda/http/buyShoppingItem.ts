import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { buyShoppingItem } from '../../businessLogic/shoppingItems'
import { createLogger } from '../../utils/logger'

const logger = createLogger('buyShoppingItemLambda')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const shoppingId = event.pathParameters.shoppingId

  logger.info(shoppingId);
  
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const result = await buyShoppingItem(shoppingId, jwtToken)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
        result
    })
  }

}

