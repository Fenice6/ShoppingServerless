import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createShoppingItem, deleteShoppingItem, getVisibleShoppingItems, patchShoppingItem, getShoppingItemsOfUser, buyShoppingItem } from '../api/shopping-api'
import Auth from '../auth/Auth'
import { ShoppingItem } from '../types/ShoppingItem'
import { ShoppingItemStatusEnum } from '../types/enums/ShoppingItemStatusEnum'

interface ShoppingProps {
  auth: Auth
  history: History
}

interface ShoppingState {
  visibleShoppingItems: ShoppingItem[]
  myShoppingItems: ShoppingItem[]
  newShoppingItemName: string
  newShoppingItemDescription: string
  newShoppingItemPrice: number
  loadingShoppingItems: boolean
}

export class ShoppingItems extends React.PureComponent<ShoppingProps, ShoppingState> {
  state: ShoppingState = {
    visibleShoppingItems: [],
    myShoppingItems: [],
    newShoppingItemName: '',
    newShoppingItemDescription: '',
    newShoppingItemPrice: -1,
    loadingShoppingItems: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newShoppingItemName: event.target.value })
  }

  handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newShoppingItemDescription: event.target.value })
  }

  handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newShoppingItemPrice: TryParseInt(event.target.value,-1) })
  }

  onEditButtonClick = (shoppingId: string) => {
    this.props.history.push(`/shoppingItems/${shoppingId}/edit`)
  }

  onShoppinItemCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const newShoppingItem = await createShoppingItem(this.props.auth.getIdToken(), {
        name: this.state.newShoppingItemName,
        description: this.state.newShoppingItemDescription,
        price: this.state.newShoppingItemPrice
      })
      this.setState({
        visibleShoppingItems: [...this.state.visibleShoppingItems, newShoppingItem],
        myShoppingItems: [...this.state.myShoppingItems, newShoppingItem],
        newShoppingItemName: '',
        newShoppingItemDescription: '',
        newShoppingItemPrice: -1
      })
    } catch {
      alert('Shopping item creation failed')
    }
  }

  onShoppingItemDelete = async (shoppingId: string) => {
    try {
      await deleteShoppingItem(this.props.auth.getIdToken(), shoppingId)
      this.setState({
        visibleShoppingItems: this.state.visibleShoppingItems.filter(shoppingItem => shoppingItem.shoppingId !== shoppingId),
        myShoppingItems: this.state.myShoppingItems.filter(shoppingItem => shoppingItem.shoppingId !== shoppingId)
      })
    } catch {
      alert('Shopping Item deletion failed')
    }
  }

  onShoppingItemBuy = async (shoppingId: string) => {
    try {
      await buyShoppingItem(this.props.auth.getIdToken(), shoppingId)
      this.setState({
        visibleShoppingItems: this.state.visibleShoppingItems.filter(shoppingItem => shoppingItem.shoppingId !== shoppingId),
        myShoppingItems: this.props.auth.isAuthenticated() ? await getShoppingItemsOfUser(this.props.auth.getIdToken()):[]
      })
    } catch {
      alert('Shopping Item deletion failed')
    }
  }

  onShoppingItemVisibleCheck = async (pos: number) => {
    try {
      const shoppingItem = this.state.myShoppingItems[pos]
      if(shoppingItem.status!==ShoppingItemStatusEnum.Available && shoppingItem.status!==ShoppingItemStatusEnum.Hidden)
        throw new Error("Wrong status")
      await patchShoppingItem(this.props.auth.getIdToken(), shoppingItem.shoppingId, {
        name: shoppingItem.name,
        description: shoppingItem.description,
        price: shoppingItem.price,
        hidden: shoppingItem.status===ShoppingItemStatusEnum.Available ? true : false 
      })
      if(shoppingItem.status===ShoppingItemStatusEnum.Available){
        this.setState({
          myShoppingItems: update(this.state.myShoppingItems, {
            [pos]: { status: { $set: shoppingItem.status=ShoppingItemStatusEnum.Hidden } }
          }),
          visibleShoppingItems: this.state.visibleShoppingItems.filter(si => si.shoppingId !== shoppingItem.shoppingId)
        })
      }
      else
        if(shoppingItem.status===ShoppingItemStatusEnum.Hidden){
          this.setState({
            myShoppingItems: update(this.state.myShoppingItems, {
              [pos]: { status: { $set: shoppingItem.status=ShoppingItemStatusEnum.Available } }
            }),
            visibleShoppingItems: await getVisibleShoppingItems()
          })
        }
    } catch {
      alert('Shopping item change visible failed')
    }
  }

  async componentDidMount() {
    try {
      const visibleShoppingItems = await getVisibleShoppingItems()
      const myShoppingItems = this.props.auth.isAuthenticated() ? await getShoppingItemsOfUser(this.props.auth.getIdToken()):[]
      this.setState({
        visibleShoppingItems,
        myShoppingItems,
        loadingShoppingItems: false
      })
    } catch (e) {
      alert(`Failed to fetch shoppingItems: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">ShoppingItems</Header>
        <Header as="h2">All items</Header>

        {this.renderShoppingItems()}

        {this.props.auth.isAuthenticated() && (<Header as="h2">My items</Header>)}

        {this.props.auth.isAuthenticated() && this.renderCreateSHoppinItemInput()}
        {this.props.auth.isAuthenticated() && this.renderMyShoppingItems()}
      </div>
    )
  }

  renderCreateSHoppinItemInput() {
    return (
      <Grid padded>
        <Grid.Row>
          <Grid.Column width={16}>
            <Input
              action={{
                color: 'teal',
                labelPosition: 'left',
                icon: 'add',
                content: 'New item',
                onClick: this.onShoppinItemCreate
              }}
              fluid
              actionPosition="left"
              placeholder="Name"
              onChange={this.handleNameChange}
            />
          </Grid.Column>
          <Grid.Column width={16}>
            <Input
              fluid
              actionPosition="left"
              placeholder="Description"
              onChange={this.handleDescriptionChange}
            />
          </Grid.Column>
          <Grid.Column width={16}>
            <Input
              fluid
              actionPosition="left"
              placeholder="Price"
              onChange={this.handlePriceChange}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }

  renderShoppingItems() {
    if (this.state.loadingShoppingItems) {
      return this.renderLoading()
    }

    return this.renderShoppingItemsList()
  }

  renderMyShoppingItems() {
    if (this.props.auth.isAuthenticated() ){
      if (this.state.loadingShoppingItems) {
        return this.renderLoading()
      }

      return this.renderMyShoppingItemsList()
  }
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Items
        </Loader>
      </Grid.Row>
    )
  }

  renderShoppingItemsList() {
    return (
      <Grid padded>
        {this.state.visibleShoppingItems.map((shoppinItem, pos) => {
          return (
            <Grid.Row key={shoppinItem.shoppingId}>
              <Grid.Column width={1} verticalAlign="middle">
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {shoppinItem.name}
                <br></br>
                {shoppinItem.description}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {shoppinItem.price}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {this.props.auth.isAuthenticated() &&
                  (
                  <Button
                    icon
                    color="green"
                    onClick={() => this.onShoppingItemBuy(shoppinItem.shoppingId)}
                  >
                    <Icon name="shopping cart" />
                  </Button>)}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
              </Grid.Column>
              {shoppinItem.attachmentUrl && (
                <Image src={shoppinItem.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  renderMyShoppingItemsList() {
    return (
      <Grid padded>
        {this.state.myShoppingItems.map((shoppinItem, pos) => {
          return (
            <Grid.Row key={shoppinItem.shoppingId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onShoppingItemVisibleCheck(pos)}
                  checked={shoppinItem.status===ShoppingItemStatusEnum.Available}
                  disabled={shoppinItem.status>ShoppingItemStatusEnum.Hidden}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {shoppinItem.name}
                <br></br>
                {shoppinItem.description}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {shoppinItem.price}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {this.props.auth.isAuthenticated() &&
                (
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(shoppinItem.shoppingId)}
                >
                  <Icon name="pencil" />
                </Button>)}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {this.props.auth.isAuthenticated() &&
                (<Button
                  icon
                  color="red"
                  onClick={() => this.onShoppingItemDelete(shoppinItem.shoppingId)}
                >
                  <Icon name="delete" />
                </Button>)}
              </Grid.Column>
              {shoppinItem.attachmentUrl && (
                <Image src={shoppinItem.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

}
function TryParseInt(str: any,defaultValue: number) {
  var retValue = defaultValue;
  if(str !== null) {
      if(str.length > 0) {
          if (!isNaN(str)) {
              retValue = parseInt(str);
          }
      }
  }
  return retValue;
}