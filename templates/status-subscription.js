import icon from '../assets/icon-status-subscription.png'

export default {
  type: 'status-subscription',
  description: 'status-subscription',
  group: 'dataSource',
  /* line|shape|textAndMedia|chartAndGauge|table|container|dataSource|IoT|3D|warehouse|form|etc */
  icon,
  model: {
    type: 'status-subscription',
    left: 10,
    top: 10,
    width: 100,
    height: 100,
    autoStart: true,
    period: 0
  }
}
