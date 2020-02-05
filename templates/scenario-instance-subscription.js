import icon from '../assets/icon-integration.png'

export default {
  type: 'scenario-instance-subscription',
  description: 'scenario-instance-subscription',
  group: 'dataSource',
  /* line|shape|textAndMedia|chartAndGauge|table|container|dataSource|IoT|3D|warehouse|form|etc */
  icon,
  model: {
    type: 'scenario-instance-subscription',
    left: 10,
    top: 10,
    width: 100,
    height: 100,
    autoStart: true,
    period: 0,
    endpoint: 'ws://localhost:3000/subscriptions',
    initDataEndpoint: '/',
  }
}
