const excelStyles = {
    headerDark: {
        fill: {
            fgColor: {
                rgb: 'FF000000'
            }
        },
        font: {
            color: {
                rgb: 'FFFFFFFF'
            },
            sz: 14,
            bold: true,
            //underline: true
        },
        alignment: { 
            horizontal: 'left' 
        }
    },
    headerDarkTitleCenter: {
        fill: {
            fgColor: {
                rgb: 'FF000000'
            }
        },
        font: {
            color: {
                rgb: 'FFFFFFFF'
            },
            sz: 18,
            bold: true,
            //underline: true
        },
        alignment: { 
            horizontal: 'center' 
        }
    },
    headerDarkSubTitleCenter: {
        fill: {
            fgColor: {
                rgb: 'FF000000'
            }
        },
        font: {
            color: {
                rgb: 'FFFFFFFF'
            },
            sz: 14,
            bold: true,
            //underline: true
        },
        alignment: { 
            horizontal: 'center' 
        }
    },
    cellPink: {
        fill: {
            fgColor: {
                rgb: 'FFFFCCFF'
            }
        }
    },
    cellGreen: {
        fill: {
            fgColor: {
                rgb: 'FF00FF00'
            }
        }
    },
    cellBorderDefault: {
        border: {
            top: {
                style: 'thin',
                color: 'FF000000'
            },
            bottom: {
                style: 'thin',
                color: 'FF000000'
            },
            left: {
                style: 'thin',
                color: 'FF000000'
            },
            right: {
                style: 'thin',
                color: 'FF000000'
            },
        }
    }
};

module.exports = {
    excelStyles
};