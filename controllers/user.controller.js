var admin = require("firebase-admin");

const getUsers = async (req, res) => {
    try {
        await admin.auth().listUsers().then(async (resp) => {
            let data = [];
            data = resp;
            return res.status(200).json({
                msg: 'OK',
                data: data
            })
        });


    } catch (error) {
        return res.status(200).json({ msg: error, data: [] });
    }


}

const inhabilitarUser = async (req, res) => {
    try {
        const uuid = req.params.id;
        const activo = parseInt(req.params.activo);

        let act = false;
        if (activo === 1) {
            act = true
        }
        await admin.auth().updateUser(uuid, {
            displayName: 'Jane Doe', disabled: act

        }).then(user => {
            return res.status(200).json({
                status: 'OK',
                data: user
            })
        })
    } catch (error) {
        return res.status(200).json({
            status: 'Error',
            msg: error
        })

    }
}


const changePassword = async (req, res) => {
    try {

        await admin.auth().generatePasswordResetLink(req.params.email).then((resp) => {

            return res.status(200).json({
                status: 'OK',
                data: resp
            })
        })
    } catch (error) {
        return res.status(200).json({
            status: 'Error',
            msg: error
        })

    }
}

module.exports = {
    getUsers, inhabilitarUser, changePassword
}