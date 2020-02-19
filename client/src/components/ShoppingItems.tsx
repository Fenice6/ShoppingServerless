import { History } from 'history'
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

import { createShoppingItem, deleteShoppingItem, getVisibleShoppingItems, patchShoppingItem, getShoppingItemsOfUser } from '../api/shopping-api'
import Auth from '../auth/Auth'
import { ShoppingItem } from '../types/ShoppingItem'

interface ShoppingProps {
  auth: Auth
  history: History
}

interface ShoppingState {
  visibleShoppingItems: ShoppingItem[]
  myShoppingItems: ShoppingItem[]
  newShoppingItemName: string
  loadingShoppingItems: boolean
}

export class ShoppingItems extends React.PureComponent<ShoppingProps, ShoppingState> {
  state: ShoppingState = {
    visibleShoppingItems: [],
    myShoppingItems: [],
    newShoppingItemName: '',
    loadingShoppingItems: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newShoppingItemName: event.target.value })
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

        {this.props.auth.isAuthenticated() && this.renderMyShoppingItems()}
      </div>
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
                >
                  <Icon name="pencil" />
                </Button>)}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {this.props.auth.isAuthenticated() &&
                (<Button
                  icon
                  color="red"
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
