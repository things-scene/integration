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
    },
    {
      type: 'string',
      label: 'variables',
      name: 'variables'
    }
  ],
  'value-property': 'variables'
}

export default class ScenarioCall extends DataSource(RectPath(Shape)) {
  static get image() {
    if (!ScenarioCall._image) {
      ScenarioCall._image = new Image()
      ScenarioCall._image.src = COMPONENT_IMAGE
    }
    return ScenarioCall._image
  }

  render(context) {
    var { left, top, width, height } = this.bounds
    context.beginPath()
    context.drawImage(ScenarioCall.image, left, top, width, height)
  }

  ready() {
    super.ready()
    this._initScenario()
  }

  _initScenario() {
    if (!this.app.isViewMode) return
    this._client = createLocalClient()
    this.requestData()
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
    console.log(after)
    if ('variables' in after) {
      this.requestData()
    }
  }

  get client() {
    return this._client
  }

  async requestData() {
    let { instanceName, scenarioName } = this.state
    if (!scenarioName || !this.app.isViewMode) return

    var client = this._client
    try {
      var variables = typeof this.variables == 'string' ? JSON.parse(this.variables) : this.variables
    } catch (e) {
      console.error(e)
    }

    if (client) {
      var response = await client.query({
        query: gql`
          mutation($instanceName: String, $scenarioName: String!, $variables: Object) {
            callScenario(instanceName: $instanceName, scenarioName: $scenarioName, variables: $variables) {
              state
              message
              data
            }
          }
        `,
        variables: {
          instanceName: instanceName,
          scenarioName: scenarioName,
          variables
        }
      })

      this.data = response
    }
  }
}

Component.register('scenario-call', ScenarioCall)
