import icon from '../assets/icon-scenario-control.png'

export default {
  type: 'scenario-control',
  description: 'scenario-control',
  group: 'dataSource',
  /* line|shape|textAndMedia|chartAndGauge|table|container|dataSource|IoT|3D|warehouse|form|etc */
  icon,
  model: {
    type: 'scenario-control',
    left: 10,
    top: 10,
    width: 100,
    height: 100,
    autoStart: true,
    period: 0,
    endpoint: '/',
    controlType: 'start'
  }
}
