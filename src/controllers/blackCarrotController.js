import Content from "../models/Content";
import CalenderInfo from "../models/CalenderInfo";
import User from "../models/User";
import KilnInfo from "../models/KilnInfo";

export const registerLikes = async (req, res) => {
    const {id} = req.params;
    if(!id) {
        return;
    }
    const content = await Content.findById(id);
    if (!Boolean(req.session)) {
        return res.status(401).json({
            isLoggedIn : false, 
            counts : content.meta.likes
        });
    }
    const {user:{_id}} = req.session;

    if (!content) {
        return res.status(404).json(null);
    }
    
    if (!content.likedUser.includes(_id)) {
        content.likedUser.push(_id);
        content.meta.likes = content.likedUser.length;
        await content.save();
        return res.json({
            isLoggedIn : true, 
            counts:content.meta.likes,
            type : "solid"
        });
    }
    content.likedUser = content.likedUser.filter((element)=>String(element) !== String(_id));
    content.meta.likes = content.likedUser.length;
    await content.save();
    return res.json({
        isLoggedIn : true, 
        counts:content.meta.likes,
        type : "regular",
    });
}

export const blackCarrot = async (req, res) => {
    const blackCarrotContents = await Content.find({contentType:1});
    return res.render("blackCarrot", {blackCarrotContents});
}

export const trending = async (req, res) => {
    const blackCarrotContents = await Content.find({contentType:1});
    const secretContents = await Content.find({contentType:2});
    const infoShareContents = await Content.find({contentType:3});

    const {user} = req.session;
    if (!user) {
        return res.render("home", {
            pageTitle : "home", 
            blackCarrotContents, 
            secretContents,
            infoShareContents,
            calenderInfo : false,
        })
    }
    const calenderInfo = await CalenderInfo.find({owner : user._id});
    const kilnInfo = await KilnInfo.find({owner : user._id});
    
    return res.render("home", {
        pageTitle : "home", 
        blackCarrotContents, 
        secretContents,
        infoShareContents,
        calenderInfo,
        kilnInfo
    })
};

export const getEdit = (req, res) => {
    const { id } = req.params;
    // const video = videos[id - 1];
    // return res.render("edit", { pageTitle: `Editing: ${video.title}`, video });
};
export const postEdit = (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    // videos[id - 1].title = title;
    // return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
    return res.render("upload", { pageTitle: "Upload Video"});
};

export const postUpload = async (req, res) => {
    // ????????? ????????? ????????? ?????? ??????
    const {
        user: {_id},
    } = req.session;
    const {
        body: {title, description, contentType},
        file,
     }= req;
    try { 
        const newContent = await Content.create({
            title,
            description,
            contentType,
            owner:_id,
            meta: {
                views : 0,
                likes: 0,
            },
            contentImage : file.path,
        });
        const user = await User.findById(_id);
        user.contents.push(newContent._id);
        await user.save();
        return res.redirect("/");
    } catch (error) {
        return res.render("upload", {
            errorMessage: error._message,
        });
    }
};

export const search = async (req, res) => {
    const {
        query:{keyword},
    } = req;

    let total_list_temper = [];
    let total_list = [];
    let description_list = [];
    let result_match;

    const carrot_list = [];
    const secret_list = [];
    const info_list = [];
    const getUser_list = [];
    
    // ??????????????? ?????????
    if (keyword.trim() === "") {
        return res.render("searchResult", {result:[], keyword});
    }
    // ?????????
    if (keyword.length === 1) {
        const result = await Content.find({
            title : { $regex: keyword, $options: "i" },
        });
        return res.render("searchResult", {result, keyword});
    }

    // ?????? ????????? ?????? ??????
    const keyword_split_list = [...new Set(keyword.split(" "))];

    // ?????? ???????????? ????????? ????????? ???????????? ???????????? ?????? ?????? ??????!
    if (keyword_split_list.length !== 1) {
        result_match = await Content.find({
            title : { $regex: keyword, $options: "i" },
        }).populate("owner");
    }
    
    // ????????? ???????????? ????????? ?????? ?????? ??????
    for (let single_keyword of keyword_split_list) {
        const result = await Content.find({
            title : { $regex: single_keyword, $options: "i" },
        }).populate("owner");
        total_list_temper = [
            ...total_list_temper,
            ...result,
        ];

        const description_result = await Content.find({
            description : { $regex: single_keyword, $options: "i" },
        }).populate("owner");
        description_list = [
            ...description_list,
            ...description_result,
        ];
    }

    // ???????????? : ???????????? ?????? ?????? ?????? ?????? ?????? ???
    total_list_temper = [
        ...total_list_temper,
        ...description_list,
    ];

    // total_list ?????? ??????
    const check =  new Set();
    let before_length;
    for (let i in total_list_temper) {
        before_length = check.size;
        check.add(String(total_list_temper[i]._id));
        if (before_length !== check.size) {
            total_list.push(total_list_temper[i]);
        }
    }

    // ?????? ????????? ?????? ?????? ?????? ??????
    if (result_match) {
        total_list = [result_match, ...total_list];
        total_list = total_list.map((list)=> list._id !== result_match._id);
    }

    if (total_list.length ===1 && total_list[0] === false) {
        total_list.pop();
    }   

    // ????????? ?????? ?????? ????????? ????????? ??? ????????? ????????????
    for (let i of total_list) {
        if (i.contentType === 1) {
            carrot_list.push(i);
        } else if (i.contentType === 2) {
            secret_list.push(i);
        } else if (i.contentType === 3) {
            info_list.push(i);
        } else if (i.contentType === 4) {
            getUser_list.push(i);
        }
    }

    return res.render("searchResult", {
        result : total_list,
        carrot_list,
        secret_list,
        info_list,
        getUser_list,
        keyword,});
};


export const deleteContent = (req, res) => {
  return res.send("Delete Video");
};