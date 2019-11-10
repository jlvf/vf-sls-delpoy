import 'source-map-support/register';

export const initstack = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Lambda Works!',
      input: event,
      env: process.env
    }, null, 2),
  };
}
