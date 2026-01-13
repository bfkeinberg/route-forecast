module.exports = function GPXParser() {
  this.parse = jest.fn();
  this.tracks = [];
  this.metadata = { name: 'Test GPX' };
};
