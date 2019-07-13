module.exports = {
    test1: function (str='123') {
        return str +' test1 from server 7'
    },
    test2: function () {
        return  this.test1()
    },

}
