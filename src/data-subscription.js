/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

import COMPONENT_IMAGE from '../assets/symbol-integration.png'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { Component, DataSource, RectPath, Shape } from '@hatiolab/things-scene'

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
      label: 'tag',
      name: 'tag'
    }
  ]
}

export default class DataSubscription extends DataSource(RectPath(Shape)) {
  static get image() {
    if (!DataSubscription._image) {
      DataSubscription._image = new Image()
      DataSubscription._image.src = COMPONENT_IMAGE
    }

    return DataSubscription._image
  }

  dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    if (this.client) {
      this.client.unsubscribeAll()
      this.client.close(true)
    }

    super.dispose()
  }

  render(context) {
    var { left, top, width, height } = this.bounds

    context.beginPath()
    context.drawImage(DataSubscription.image, left, top, width, height)
  }

  ready() {
    this._initDataSubscription()
  }

  get nature() {
    return NATURE
  }

  _initDataSubscription() {
    if (!this.app.isViewMode) return

    this.requestData()
  }

  async requestData() {
    var { endpoint, tag } = this.state
    var self = this
    var query = `
    subscription {
      publishData(tag: "${tag}") {
        tag
        data
      }
    }`

    this.client = new SubscriptionClient(endpoint, {
      reconnect: true
    })

    this.client.onError(() => {
      var client = this.client
      // 보드가 실행중이면 재시도, 아니면 재연결 취소
      if (this.disposed) client.reconnect = false
      this.client.unsubscribeAll()
      this.client.close(true)
    })

    this.client.onConnected(() => {
      this.subscription = this.client.request({ query }).subscribe({
        next({ data }) {
          if (data) {
            self.data = data
          }
        }
      })
    })
  }
}

Component.register('data-subscription', DataSubscription)
