/*
 * Copyright © HatioLab Inc. All rights reserved.
 */
import COMPONENT_IMAGE from '../assets/symbol-integration.png'
import { Component, DataSource, RectPath, Shape } from '@hatiolab/things-scene'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { onError } from 'apollo-link-error'
import gql from 'graphql-tag'

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore'
  },
  query: {
    fetchPolicy: 'no-cache', //'network-only'
    errorPolicy: 'all'
  },
  mutate: {
    errorPolicy: 'all'
  }
}

const ERROR_HANDLER = ({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) => {
      document.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            level: 'error',
            message: `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
            ex: graphQLErrors
          }
        })
      )
    })

  if (networkError) {
    switch (networkError.statusCode) {
      case 401:
        /* 401 에러가 리턴되면, 인증이 필요하다는 메시지를 dispatch 한다. 이 auth 모듈 등에서 이 메시지를 받아서 signin 프로세스를 진행할 수 있다. */
        document.dispatchEvent(
          new CustomEvent('auth-required', {
            bubbles: true,
            composed: true
          })
        )
        break
      default:
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              level: 'error',
              message: `[Network error - ${networkError.statusCode}]: ${networkError}`,
              ex: networkError
            }
          })
        )
    }
  }
}

const NATURE = {
  mutable: false,
  resizable: true,
  rotatable: true,
  properties: [
    {
      type: 'string',
      label: 'endpoint',
      name: 'endpoint'
    },
    {
      type: 'string',
      label: 'scenario-name',
      name: 'scenarioName'
    },
    {
      type: 'select',
      label: 'control-type',
      name: 'controlType',
      property: {
        options: [{
          display: "start",
          value: "start"
        }, {
          display: "stop",
          value: "stop"
        },
        {
          display: "pause",
          value: "pause"
        },
        {
          display: "resume",
          value: "resume"
        }
        ]
      }
    }
  ],
  'value-property': 'value'
}

export default class ScenarioControl extends DataSource(RectPath(Shape)) {
  static get image() {
    if (!ScenarioControl._image) {
      ScenarioControl._image = new Image()
      ScenarioControl._image.src = COMPONENT_IMAGE
    }
    return ScenarioControl._image
  }

  render(context) {
    var { left, top, width, height } = this.bounds
    context.beginPath()
    context.drawImage(ScenarioControl.image, left, top, width, height)
  }

  ready() {
    super.ready()
    if (!this.app.isViewMode) return
    this._makeClient()
  }

  dispose() {
    super.dispose()

    try {
      if (this._client) {
        this._client.stop()
      }
    } catch (e) {
      console.error(e)
    }
    delete this._client
  }

  get nature() {
    return NATURE
  }

  onchange(after) {
    if ('value' in after) {
      this.requestData()
    }
  }

  get client() {
    return this._client
  }

  _makeClient() {
    var endpoint = this.state.endpoint
    if (!endpoint) return
    var cache = new InMemoryCache()
    const client = new ApolloClient({
      defaultOptions,
      cache,
      link: ApolloLink.from([
        onError(ERROR_HANDLER),
        new HttpLink({
          endpoint,
          credentials: 'include'
        })
      ])
    })
    this._client = client
  }
  async requestData() {
    let { controlType, scenarioName } = this.state
    if (!controlType || !scenarioName || !this.app.isViewMode) return
    var client = this._client
    var query = ''
    if (controlType == 'start') {
      query = `mutation{
        ${controlType}Scenario(instanceName: "${scenarioName}", scenarioName: "${scenarioName}", variables:{}) {
          state
        }
      }`
    } else {
      query = `mutation{
        ${controlType}Scenario(instanceName: "${scenarioName}") {
          state
        }
      }`
    }

    if (client) {
      var response = await client.query({
        query: gql`
        ${query}
        `
      })
      this.data = response
    }
  }
}

Component.register('scenario-control', ScenarioControl)
