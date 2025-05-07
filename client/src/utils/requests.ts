/**
 * Utility functions to make API requests.
 */

// ex: formatParams({ some_key: "some_value", a: "b"}) => "some_key=some_value&a=b"
function formatParams(params: Record<string, any>): string {
  return Object.keys(params)
    .map((key) => key + "=" + encodeURIComponent(params[key]))
    .join("&");
}

// convert a fetch result to a JSON object with error handling for fetch and json errors
function convertToJSON(res: Response): Promise<any> {
  if (!res.ok) {
    throw `API request failed with response status ${res.status} and text: ${res.statusText}`;
  }

  return res
    .clone()
    .json()
    .catch((error) => {
      // throw an error containing the text that couldn't be converted to JSON
      return res.text().then((text) => {
        throw `API request's result could not be converted to a JSON object: \n${text}`;
      });
    });
}

// Helper code to make a get request. Default parameter of empty JSON Object for params.
// Returns a Promise to a JSON Object.
export function get(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<any> {
  const fullPath = endpoint + "?" + formatParams(params);
  return fetch(fullPath)
    .then(convertToJSON)
    .catch((error) => {
      throw `GET request to ${fullPath} failed with error:\n${error}`;
    });
}

// Helper code to make a post request. Default parameter of empty JSON Object for params.
// Returns a Promise to a JSON Object.
export function post(
  endpoint: string,
  params: Record<string, any> = {},
): Promise<any> {
  return fetch(endpoint, {
    method: "post",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(params),
  })
    .then(convertToJSON)
    .catch((error) => {
      throw `POST request to ${endpoint} failed with error:\n${error}`;
    });
}
