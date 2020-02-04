/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

import COMPONENT_IMAGE from '../assets/symbol-status-subscription.png'
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
      label: 'scenario-name',
      name: 'scenarioName'
    }
  ]
}

export default class StatusSubscription extends DataSource(RectPath(Shape)) {
  static get image() {
    if (!StatusSubscription._image) {
      StatusSubscription._image = new Image()
      StatusSubscription._image.src = COMPONENT_IMAGE
    }

    return StatusSubscription._image
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
    context.drawImage(StatusSubscription.image, left, top, width, height)
  }

  ready() {
    this._initStatusSubscription()
  }

  get nature() {
    return NATURE
  }

  _initStatusSubscription() {
    if (!this.app.isViewMode) return

    this.requestData()
  }

  async requestData() {
    var { endpoint, scenarioName } = this.state
    if (!scenarioName || scenarioName == 'All') {
      scenarioName = ''
    }
    var self = this
    var query = `
    subscription {
      scenarioState(name: "${scenarioName}") {
        name
        state
        progress {
          rounds
          rate
          step
          steps
        }
        message
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

Component.register('status-subscription', StatusSubscription)
