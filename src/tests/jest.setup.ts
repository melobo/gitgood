// jest.setup.ts
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
