import {timeSince} from 'util/date_format';

describe('date_format', function() {
  describe('timeSince', function() {
    beforeEach(function() {
      jasmine.clock().install();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });

    it('formats a time for today', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 11, 5, 3, 15));

      expect(result).toEqual('today at 3:15');
    });

    it('formats a time for today with zero-padded minutes', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 11, 5, 3, 5));

      expect(result).toEqual('today at 3:05');
    });

    it('formats a time for yesterday', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 11, 4, 13, 15));

      expect(result).toEqual('yesterday at 13:15');
    });

    it('formats a time for yesterday with zero-padded minutes', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 11, 4, 13, 5));

      expect(result).toEqual('yesterday at 13:05');
    });

    it('formats a time for one day ago', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 11, 4, 4, 30));

      expect(result).toEqual('one day ago');
    });

    it('formats a time for 4 days ago', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 11, 1, 2, 30));

      expect(result).toEqual('4 days ago');
    });

    it('formats a time for one week ago', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 10, 28, 4, 30));

      expect(result).toEqual('one week ago');
    });

    it('formats a time for 4 weeks ago', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 10, 1, 2, 30));

      expect(result).toEqual('4 weeks ago');
    });

    it('formats a time in the future', function() {
      jasmine.clock().mockDate(new Date(1978, 11, 5, 4, 30));
      const result = timeSince(new Date(1978, 11, 5, 4, 31));

      expect(result).toEqual('in the future');
    });
  });
});
