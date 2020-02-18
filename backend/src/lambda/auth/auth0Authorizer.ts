import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
//import { decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = ''

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  logger.info(jwt);

  // Info here: https://auth0.com/blog/navigating-rs256-and-jwks/
  var jwts = await getJwtsToken(jwksUrl)
  if (!jwts) 
    throw new Error('Jwts not found')
  logger.info(jwts)
  return verify(token, //token dall'header HTTP da validare
     "-----BEGIN CERTIFICATE-----\n" + jwts[0].x5c[0] + "\n-----END CERTIFICATE-----", //certificato dal sito Auth0
      { algorithms: ['RS256'] } // asymmetric algorithm
  ) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getJwtsToken(jwtsUrl: string) : Promise<any> {
  var resp = await axios.get(jwtsUrl)
  .then(response => {
    return response.data.keys
  })
  .catch(error => {
    logger.error(error);
    return null
  });
  return resp

}

