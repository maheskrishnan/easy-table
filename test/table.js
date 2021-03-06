var should = require('should')
var Table = require('../lib/table')

describe('Easy table', function () {
    var t

    beforeEach(function () {
        t = new Table
    })

    function expectLine (line) {
        line--
        return t.toString().split('\n')[line].should
    }

    it('Formating', function () {
        t.cell('First column', '11')
        t.cell('Second column', '12')
        t.newRow()

        t.cell('First column', '21')
        t.cell('Second column', '22')
        t.newRow()

        t.toString().should.equal(
            'First column' + t.shift + 'Second column' + '\n' +
            '------------' + t.shift + '-------------' + '\n' +
            '11          ' + t.shift + '12           ' + '\n' +
            '21          ' + t.shift + '22           ' + '\n'
        )

        t.print().should.equal(
            '11' + t.shift + '12\n' +
            '21' + t.shift + '22\n'
        )
    })

    it('Printing transposed version', function () {
        t.cell('c1', 11).cell('c2', 12).newRow()
        t.cell('c1', 21).cell('c2', 22).newRow()
        t.printTransposed(':').should.equal(
            'c1:11:21\n' +
            'c2:12:22\n'
        )
    })

    it('Table.printArray()', function () {
        var arr = [{
            foo: 'fooooooooo', number: 1.345
        }]

        Table.printArray(arr, {
            number: {
                name: 'bar',
                printer: Table.Number(0)
            },
            foo: {
                width: 5
            }
        }).should.equal(
            'foo  ' + '  ' + 'bar\n' +
            '-----' + '  ' + '---\n' +
            'fo...' + '  ' + '  1\n'
        )
    })

    it('Table.printObj()', function () {
        var obj = {
            foo: 'foo',
            number: 1.2
        }

        Table.printObj(obj, {
            number: {
                name: 'bar',
                printer: function () { return 'bar'}
            }
        }).should.equal(
            'foo : foo\n' +
            'bar : bar\n'
        )
    })

    it('Should adjust column width to fit all contents', function () {
        t.cell('col', '').newRow()
        expectLine(1).be.equal('col')

        t.cell('col', 'value').newRow()
        expectLine(1).be.equal('col  ')
    })

    describe('Should accept print function as third parameter to .cell() method and call it two times', function () {
        it('First time to determine minimal width', function () {
            var callCount = 0
            function print (obj) {
                obj.should.equal(10)
                if (callCount == 0) arguments.length.should.equal(1)
                callCount++
                return obj.toString()
            }
            t.cell('col', 10, print).newRow().toString()
            callCount.should.be.equal(2)
        })

        it('Second time asking to render actual value passing additional length parameter', function () {
            var callCount = 0
            function print (obj, length) {
                obj.should.equal(10)
                if (callCount == 1) length.should.equal(4)
                callCount++

                if (arguments.length == 1) return '10  '
                return ' 10 '
            }
            t.cell('col', 10, print).newRow()
            expectLine(3).be.equal(' 10 ')
        })

        it('It should be called with `this` set to row', function () {
            function print (obj) {
                this.should.have.property('bar')
                this.should.have.property('baz')
                return obj.toString()
            }
            t.cell('bar', 1, print).cell('baz', 2, print).newRow().toString()
        })
    })

    describe('Should accept column width as 4-th parameter to .cell() method. In such case:', function () {
        it('Width is fixed', function () {
            t.cell('col', 'value', null, 10).newRow()
            expectLine(3).be.equal('value     ')
        })

        it('If cell`s value doesn`t fit it should be truncated', function () {
            t.cell('col', 'A very long value', null, 14).newRow()
            expectLine(3).be.equal('A very long...')
        })
    })

    it('Table.padLeft()', function () {
        Table.padLeft('a', 2).should.equal(' a')
    })

    it('Sorting', function () {
        t.cell('a', 1).newRow()
        t.cell('a', 2).newRow()
        t.cell('a', null).newRow()
        t.cell('a', undefined).newRow()
        t.sort(['a|des'])
        expectLine(3).be.equal('    ')
        expectLine(4).be.equal('null')
        expectLine(5).be.equal('2   ')
        expectLine(6).be.equal('1   ')

        t.sort(['a'])
        expectLine(3).be.equal('1   ')
        expectLine(4).be.equal('2   ')

        t.sort(['a|des']).sort(['a|asc'])
        expectLine(3).be.equal('1   ')
        expectLine(4).be.equal('2   ')
    })

    describe('Totals', function () {
        it('Default totaling', function () {
            t.cell('a', 1).newRow()
            t.cell('a', 2).newRow()
            t.total('a')
            expectLine(6).be.equal('\u2211 3')
        })

        it('Passing aggregator with printer', function () {
            t.cell('a', 1).newRow()
            t.cell('a', 3).newRow()
            t.total('a', Table.aggr.avg)
            expectLine(6).be.equal('Avg: 2')
        })

        it('Custom format', function () {
            t.cell('a', 1).newRow()
            t.cell('a', 3).newRow()

            t.total('a', Table.aggr.avg, function format (val, width) {
                val.should.equal(2)
                return 'Hey!'
            })
            expectLine(6).be.equal('Hey!')
        })
    })
})

