import {waitForElementToBeRemoved} from '..'
import {renderIntoDocument} from './helpers/test-utils'

test('resolves on mutation only when the element is removed', async () => {
  const {queryAllByTestId} = renderIntoDocument(`
    <div data-testid="div"></div>
    <div data-testid="div"></div>
  `)
  const divs = queryAllByTestId('div')
  // first mutation
  setTimeout(() => {
    divs.forEach(d => d.setAttribute('id', 'mutated'))
  })
  // removal
  setTimeout(() => {
    divs.forEach(div => div.parentElement.removeChild(div))
  }, 100)
  // the timeout is here for two reasons:
  // 1. It helps test the timeout config
  // 2. The element should be removed immediately
  //    so if it doesn't in the first 100ms then we know something's wrong
  //    so we'll fail early and not wait the full timeout
  await waitForElementToBeRemoved(() => queryAllByTestId('div'), {timeout: 200})
})

test('resolves on mutation if callback throws an error', async () => {
  const {getByTestId} = renderIntoDocument(`
  <div data-testid="div"></div>
`)
  const div = getByTestId('div')
  setTimeout(() => {
    div.parentElement.removeChild(div)
  })
  await waitForElementToBeRemoved(() => getByTestId('div'), {timeout: 100})
})

test('requires an element to exist first', () => {
  return expect(
    waitForElementToBeRemoved(null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"The element(s) given to waitForElementToBeRemoved are already removed. waitForElementToBeRemoved requires that the element(s) exist(s) before waiting for removal."`,
  )
})

test("requires element's parent to exist first", () => {
  const {getByTestId} = renderIntoDocument(`
  <div data-testid="div">asd</div>
`)
  const div = getByTestId('div')
  div.parentElement.removeChild(div)

  return expect(
    waitForElementToBeRemoved(div),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"The element(s) given to waitForElementToBeRemoved are already removed. waitForElementToBeRemoved requires that the element(s) exist(s) before waiting for removal."`,
  )
})

test('requires an unempty array of elements to exist first', () => {
  return expect(
    waitForElementToBeRemoved([]),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"The element(s) given to waitForElementToBeRemoved are already removed. waitForElementToBeRemoved requires that the element(s) exist(s) before waiting for removal."`,
  )
})

test('requires an element to exist first (function form)', () => {
  return expect(
    waitForElementToBeRemoved(() => null),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"The element(s) given to waitForElementToBeRemoved are already removed. waitForElementToBeRemoved requires that the element(s) exist(s) before waiting for removal."`,
  )
})

test('requires an unempty array of elements to exist first (function form)', () => {
  return expect(
    waitForElementToBeRemoved(() => []),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"The element(s) given to waitForElementToBeRemoved are already removed. waitForElementToBeRemoved requires that the element(s) exist(s) before waiting for removal."`,
  )
})

test('after successful removal, fullfills promise with empty value (undefined)', () => {
  const {getByTestId} = renderIntoDocument(`
  <div data-testid="div"></div>
`)
  const div = getByTestId('div')
  const waitResult = waitForElementToBeRemoved(() => getByTestId('div'), {
    timeout: 100,
  })
  div.parentElement.removeChild(div)
  return expect(waitResult).resolves.toBeUndefined()
})

test('rethrows non-testing-lib errors', () => {
  let throwIt = false
  const div = document.createElement('div')
  const error = new Error('my own error')
  return expect(
    waitForElementToBeRemoved(() => {
      if (throwIt) {
        throw error
      }
      throwIt = true
      return div
    }),
  ).rejects.toBe(error)
})

test('throws testing-lib errors', async () => {
  const {findByTestId, queryByTestId} = renderIntoDocument(
    `<div data-testid="parent-div"></div>`,
  )

  const parentDiv = queryByTestId('parent-div')

  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      const innerElement = document.createElement('div')
      innerElement.setAttribute('data-testid', 'new-div')
      parentDiv.insertAdjacentElement('afterbegin', innerElement)
    }
  }, 20)

  const promise = async () =>
    waitForElementToBeRemoved(await findByTestId('new-div'))

  await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(`
          "Found multiple elements by: [data-testid="new-div"]

          Here are the matching elements:

          <div
            data-testid="new-div"
          />

          <div
            data-testid="new-div"
          />

          <div
            data-testid="new-div"
          />

          (If this is intentional, then use the \`*AllBy*\` variant of the query (like \`queryAllByText\`, \`getAllByText\`, or \`findAllByText\`)).

          <body>
            <div
              data-testid="parent-div"
            >
              <div
                data-testid="new-div"
              />
              <div
                data-testid="new-div"
              />
              <div
                data-testid="new-div"
              />
            </div>
          </body>

          <body>
            <div
              data-testid="parent-div"
            >
              <div
                data-testid="new-div"
              />
              <div
                data-testid="new-div"
              />
              <div
                data-testid="new-div"
              />
            </div>
          </body>"
        `)
})

test('logs timeout error when it times out', async () => {
  const div = document.createElement('div')
  await expect(
    waitForElementToBeRemoved(() => div, {timeout: 1, onTimeout: e => e}),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Timed out in waitForElementToBeRemoved."`,
  )
})

test('accepts an element as an argument and waits for it to be removed from its top-most parent', async () => {
  const {queryByTestId} = renderIntoDocument(`
    <div data-testid="div"></div>
  `)
  const div = queryByTestId('div')
  setTimeout(() => {
    div.parentElement.removeChild(div)
  }, 20)

  await waitForElementToBeRemoved(div, {timeout: 200})
})

test('accepts an array of elements as an argument and waits for those elements to be removed from their top-most parent', async () => {
  const {queryAllByTestId} = renderIntoDocument(`
    <div>
      <div>
        <div data-testid="div"></div>
      </div>
      <div>
        <div data-testid="div"></div>
      </div>
    </div>
  `)
  const [div1, div2] = queryAllByTestId('div')
  setTimeout(() => {
    div1.parentElement.removeChild(div1)
  }, 20)

  setTimeout(() => {
    div2.parentElement.removeChild(div2)
  }, 50)
  await waitForElementToBeRemoved([div1, div2], {timeout: 200})
})
