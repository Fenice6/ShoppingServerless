import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk' //xray sdk

const XAWS = AWSXRay.captureAWS(AWS) //xray sdk instance
const s3 = new XAWS.S3({ //S3 for image Item
  signatureVersion: 'v4'
})

import { ShoppingItem } from '../models/ShoppingItem'

export class ShoppingAccess {

    

}