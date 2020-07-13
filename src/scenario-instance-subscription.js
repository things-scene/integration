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

    this.queryClient = createLocalClient()

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
            self.data = data.scenarioInstanceState
          }
        }
      })
    })
  }
}

Component.register('scenario-instance-subscription', ScenarioInstanceSubscription)
