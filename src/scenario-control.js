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
      label: 'scenario-name',
      name: 'scenarioName'
    },
    {
      type: 'select',
      label: 'control-type',
      name: 'controlType',
      property: {
        options: [
          {
            display: '',
            value: ''
          },
          {
            display: 'start',
            value: 'start'
          },
          {
            display: 'stop',
            value: 'stop'
          },
          {
            display: 'pause',
            value: 'pause'
          },
          {
            display: 'resume',
            value: 'resume'
          }
        ]
      }
    }
  ],
  'value-property': 'controlType'
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
    if ('controlType' in after) {
      this.requestData()
    }
  }

  get client() {
    return this._client
  }

  get controlType() {
    return this.get('controlType')
  }

  set controlType(controlType) {
    this.set('controlType', controlType)
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
        `,
        variables:
          controlType == 'start'
            ? {
                ...this.data
              }
            : {}
      })
    }
  }
}

Component.register('scenario-control', ScenarioControl)
