
const getObjectDuplicates = (data, prop) => {
    
    var varProp = prop;
    const counts = data.reduce((p, c) => {
        const prop = c[varProp];
        if (!p.hasOwnProperty(prop)) {
            p[prop] = 0;
        }
        p[prop]++;
        return p;
    }, {});
    
    
    const countsExtended = Object.keys(counts).map(k => {
        return { prop: k, count: counts[k] };
    });
    
    return  countsExtended.filter(i=>i.count>1)

}

module.exports = { getObjectDuplicates };