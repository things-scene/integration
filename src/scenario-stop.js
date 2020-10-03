/*
 * Copyright © HatioLab Inc. All rights reserved.
 */
import COMPONENT_IMAGE from '../assets/symbol-integration.png'
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
      label: 'instance-name',
      name: 'instanceName'
    },
    {
      type: 'string',
      label: 'scenario-name',
      name: 'scenarioName'
    }
  ],
  'value-property': 'nothing'
}

export default class ScenarioStop extends DataSource(RectPath(Shape)) {
  static get image() {
    if (!ScenarioStop._image) {
      ScenarioStop._image = new Image()
      ScenarioStop._image.src = COMPONENT_IMAGE
    }
    return ScenarioStop._image
  }

  render(context) {
    var { left, top, width, height } = this.bounds
    context.beginPath()
    context.drawImage(ScenarioStop.image, left, top, width, height)
  }

  ready() {
    super.ready()
    this._initScenario()
  }

  _initScenario() {
    if (!this.app.isViewMode) {
      return
    }
    this._client = createLocalClient()
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
    if ('nothing' in after) {
      this.requestData()
    }
  }

  get nothing() {
    return this.state.nothing
  }

  set nothing(nothing) {
    this.setState('nothing', nothing)
  }

  get client() {
    return this._client
  }

  async requestData() {
    let { instanceName, scenarioName } = this.state
    instanceName = instanceName || scenarioName
    if (!instanceName || !this.app.isViewMode) return

    var client = this._client
    if (client) {
      var response = await client.query({
        query: gql`
          mutation($instanceName: String!) {
            stopScenario(instanceName: $instanceName) {
              state
              message
              data
            }
          }
        `,
        variables: {
          instanceName: instanceName
        }
      })

      this.data = response?.data?.stopScenario?.data
    }
  }
}

Component.register('scenario-stop', ScenarioStop)
