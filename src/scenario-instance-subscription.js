/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

import COMPONENT_IMAGE from '../assets/symbol-integration.png'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { Component, DataSource, RectPath, Shape } from '@hatiolab/things-scene'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloLink } from 'apollo-link'
import { createHttpLink } from 'apollo-link-http'
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
      label: 'scenario-name',
      name: 'scenarioName'
    },
    {
      type: 'string',
      label: 'instance-name',
      name: 'instanceName'
    }
  ]
}

export default class ScenarioInstanceSubscription extends DataSource(RectPath(Shape)) {
  static get image() {
    if (!ScenarioInstanceSubscription._image) {
      ScenarioInstanceSubscription._image = new Image()
      ScenarioInstanceSubscription._image.src = COMPONENT_IMAGE
    }

    return ScenarioInstanceSubscription._image
  }

  dispose() {
    super.dispose()
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    if (this.client) {
      this.client.unsubscribeAll()
      this.client.close(true)
    }

    try {
      if (this.queryClient) {
        this.queryClient.stop()
      }
    } catch (e) {
      console.error(e)
    }
    delete this.queryClient
  }

  render(context) {
    var { left, top, width, height } = this.bounds

    context.beginPath()
    context.drawImage(ScenarioInstanceSubscription.image, left, top, width, height)
  }

  ready() {
    if (!this.app.isViewMode) return
    this._initScenarioInstanceSubscription()
  }

  get nature() {
    return NATURE
  }

  _initScenarioInstanceSubscription() {
    if (!this.app.isViewMode) return
    this.requestSubData()
    this.requestInitData()
  }

  async requestInitData() {
    var { instanceName, scenarioName = '' } = this.state

    instanceName = instanceName || scenarioName

    var cache = new InMemoryCache()
    this.queryClient = new ApolloClient({
      defaultOptions,
      cache,
      link: ApolloLink.from([
        onError(ERROR_HANDLER),
        createHttpLink({
          uri: '/graphql',
          credentials: 'include'
        })
      ])
    })
    var response = await this.queryClient.query({
      query: gql`
        query{
          scenarioInstance(instanceName:"${instanceName}") {
              instanceName
              scenarioName
              state
              variables
              progress{
                  rounds
                  rate
                  steps
                  step
              }
              data
              message
              timestamp
          }
        }
      `
    })

    if (!this.data) {
      // this.data에 어떤 값이 있다면, 초기데이타를 적용할 필요가 없다.
      this.data = response.data.scenarioInstance
    }
  }

  requestSubData() {
    var { instanceName, scenarioName = '' } = this.state

    instanceName = instanceName || scenarioName

    var self = this
    var query = `subscription {
        scenarioInstanceState(instanceName: "${instanceName}", scenarioName: "${scenarioName}") {
            instanceName
            scenarioName
            state
            variables
            progress{
                rounds
                rate
                steps
                step
            }
            data
            message
            timestamp
        }
      }`

    var endpoint = location.origin.replace(/^http/, 'ws') + '/subscriptions'

    this.client = new SubscriptionClient(endpoint, {
      reconnect: true
    })

    this.client.onError(e => {
      var client = this.client
      // 보드가 실행중이면 재시도, 아니면 재연결 취소
      if (this.disposed) {
        client.reconnect = false

        this.client.unsubscribeAll()
        this.client.close(true)
      }
    })

    this.client.onConnected(() => {
      this.subscription = this.client.request({ query }).subscribe({
        next({ data }) {
          if (data) {
            self.data = data.scenarioInstanceState
          }
        }
      })
    })
  }
}

Component.register('scenario-instance-subscription', ScenarioInstanceSubscription)
