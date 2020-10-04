## data-subscription

- 서버에서 publish 된 데이타를 subscribe 하는 컴포넌트
- 속성에서 설정된 tag를 가진 publish 데이타를 받아와서 data 속성을 변화시킨다.
- properties
  - tag: subscribe 할 데이타의 태그를 지정함
- data scheme
  - publish 된 데이타의 형태를 그대로 유지한다.

## connection-state-subscription

- connection 상태를 subscribe 하는 컴포넌트
- connection 의 현재 상태를 가져와서 data 속성을 변화시킨다.
- properties
  - connection name : 커넥션의 이름을 설정함
- data scheme

```
{
  name: 'mqtt1', /* connection name */
  state: 'CONNECTED', /* 'CONNECTED' | 'DISCONNECTED' */
  timestamp: 4273809748
}
```

## scenario-instance-subscription

- 시나리오 인스턴스 상태를 subscribe 하는 컴포넌트
- 시나리오 인스턴스의 현재 상태를 가져와서 data 속성을 변화시킨다.
- properties
  - instance name : (선택값) 이 이름으로 존재하는 시나리오 인스턴스를 종료시킨다. 이 값을 설정하지 않으면, scenario name 속성값을 사용한다.
  - scenario name : (선택값) 이 값을 설정하지 않으면, scenario name 속성 값을 시나리오 인스턴스 이름으로 한다.
- data scheme

```
{
  variables: {
    ... /* 인스턴스 실행시 전달받은 파라미터들 */
  },
  data: {
    [each step name]: { /* step result */ }
  },
  state: 'STARTED' | 'STOPPED' | 'HALTED', /* 시나리오의 상태 */
  timestamp: 4273809748
}
```

## scenario-start

- 시나리오를 주어진 variables 로 시작시킨다.
- 현재 실행중인 동일한 이름(instance name)의 시나리오 인스턴스가 없는 경우에만 새로운 시나리오를 시작한다.
- variables(value 속성) 로 주어진 값이 시나리오 시작 시에 variables 변수로 주어진다. 이 값이 변화되거나, intent sensitive 가 설정된 경우에, 이 컴포넌트가 동작한다.
- properties
  - instance name : (선택값) 이 이름으로 새로 시작되는 시나리오 인스턴스의 이름을 주어진 instance name 값으로 유지한다.
    scenario-stop 시에 이 이름을 instance name으로 제공하면, 해당 시나리오 인스턴스를 종료시킨다.
    이 값을 설정하지 않으면, scenario name 속성값을 시나리오 인스턴스 이름으로 한다.
    만약, 동일한 instance name을 갖는 시나리오 인스턴스가 이미 존재하면, 새로운 시나리오 인스턴스가 시작되지 않는다.
  - scenario-name : (필수값) 시나리오 이름을 제공한다. instance name이 특별히 설정되지 않으면, scenario name이 instance name이 된다.
  - variables : 시나리오에 전달된 variables 값. 시나리오에 제공되는 파라미터 값이다. 이 컴포넌트의 value 에 연결된 속성이다.
- data
  - scenario-start 로 실행된 scenario instance 의 상태값 : 'STARTED' | 'STOPPED' | 'HALTED'

## scenario-stop

- 시나리오를 주어진 variables 로 시작시킨다.
- 현재 실행중인 동일한 이름(instance name)의 시나리오 인스턴스가 없는 경우에만 새로운 시나리오를 시작한다. 주어진 이름의 인스턴스가 없으면, 아무런 동작이 일어나지 않는다.
- value : 아무런 값이 주어져도 되며, 이 값이 변화되거나, intent sensitive 가 설정된 경우에, 이 컴포넌트가 동작한다.
- properties
  - instance name : (선택값) 이 이름으로 존재하는 시나리오 인스턴스를 종료시킨다. 이 값을 설정하지 않으면, scenario name 속성값을 사용한다. 이 값을 설정하지 않으면, scenario name 속성 값을 시나리오 인스턴스 이름으로 한다.
  - scenario name : (선택값) instance name 과 scenario name 둘 중 하나는 입력되어야 한다.
- data
  - scenario-stop 으로 종료된 scenario instance 의 상태값 : 'STOPPED' | 'HALTED'

## scenario-run (scenario-start와 구별하여 사용해야 함.)

- 시나리오를 주어진 variables 로 시작시키고, 종료된 후에 결과값을 가져온다.
  (scenario-start는 시나리오를 시작시키고 바로 리턴된다.)
- scenario-run 은 단기간에 종료가 보장되는 시나리오만을 대상으로 한다.
- scenario-run 으로 실행되는 시나리오 인스턴스는 그 이름으로 관리되지 않는다.
  (scenario-start로 실행되는 시나리오 인스턴스는 instance 이름으로 관리되며, 모니터링될 수 있다.)
- variables(value 속성) 로 주어진 값이 시나리오 시작 시에 variables 변수로 주어진다. 이 값이 변화되거나, intent sensitive 가 설정된 경우에, 이 컴포넌트가 동작한다.
- properties
  - instance name : (선택값) deprecated 이 속성은 사용되지 않을 예정임.
  - scenario-name : (필수값) 실행될 시나리오 이름.
  - variables : 시나리오에 전달된 variables 값. 시나리오에 제공되는 파라미터 값이다. 이 컴포넌트의 value 에 연결된 속성이다.
- data scheme
  - 실행 완료 후 시나리오의 최종 context를 제공받게 된다.

```
{
  variables: {
    ... /* 인스턴스 실행시 전달받은 파라미터들 */
  },
  data: {
    [each step name]: { /* step result */ }
  },
  state: 'STOPPED' | 'HALTED', /* 시나리오의 최종 상태 */
  timestamp: 4273809748
}
```

## scenario-control

- (deprecated) 이 컴포넌트는 사용되지 않을 예정이다.
- scenario-start와 scenario-stop 으로 대체됨.
