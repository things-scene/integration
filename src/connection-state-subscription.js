/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

import COMPONENT_IMAGE from '../assets/symbol-integration.png'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { Component, DataSource, RectPath, Shape } from '@hatiolab/things-scene'
import gql from 'graphql-tag'
import { createLocalClient } from './local-client'

const NATURE = {
  mutable: false,
  resizable: true,
  rotatable: true,
  properties: [
    {
      type: 'string',
      label: 'connection-name',
      name: 'connectionName'
    }
  ]
}

export default class ConnectionStateSubscription extends DataSource(RectPath(Shape)) {
  static get image() {
    if (!ConnectionStateSubscription._image) {
      ConnectionStateSubscription._image = new Image()
      ConnectionStateSubscription._image.src = COMPONENT_IMAGE
    }

    return ConnectionStateSubscription._image
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
    context.drawImage(ConnectionStateSubscription.image, left, top, width, height)
  }

  ready() {
    if (!this.app.isViewMode) return
    this._initConnectionStateSubscription()
  }

  get nature() {
    return NATURE
  }

  _initConnectionStateSubscription() {
    if (!this.app.isViewMode) return
    this.requestSubData()
    this.requestInitData()
  }

  async requestInitData() {
    var { connectionName } = this.state

    this.queryClient = createLocalClient()

    var response = await this.queryClient.query({
      query: gql`
        query{
          fetchConnectionState(name:"${connectionName}") {
            name
            state
            timestamp
          }
        }
      `
    })

    if (!this.data) {
      // this.data에 어떤 값이 있다면, 초기데이타를 적용할 필요가 없다.
      this.data = response.data.fetchConnectionState
    }
  }

  requestSubData() {
    var { connectionName } = this.state

    var self = this
    var query = `subscription {
        connectionState(name: "${connectionName}") {
          name
          state
          timestamp
        }
      }`

    var endpoint = location.origin.replace(/^http/, 'ws') + '/subscriptions'

    this.client = new SubscriptionClient(endpoint, {
      reconnect: true
    })

    this.client.onError(e => {
      // 보드가 실행중이면 재시도, 아니면 재연결 취소
      if (this.disposed) {
        this.client.reconnect = false

        this.client.unsubscribeAll()
        this.client.close(true)
      }
    })

    this.client.onConnected(() => {
      this.subscription = this.client.request({ query }).subscribe({
        next({ data }) {
          if (data) {
            self.data = data.connectionState
          }
        }
      })
    })
  }
}

Component.register('connection-state-subscription', ConnectionStateSubscription)
