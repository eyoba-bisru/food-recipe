import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import FavoriteOutlined from "@mui/icons-material/FavoriteBorderOutlined";
import Favorite from "@mui/icons-material/Favorite";
import Bookmark from "@mui/icons-material/Bookmark";
import BookmarkOutlined from "@mui/icons-material/BookmarkAddOutlined";
import Navbar from "../../components/navbar";
import { Avatar, Button, IconButton, TextField } from "@mui/material";
import { useRouter } from "next/router";
import interceptAxios from "../../lib/axiosUserConfig";
import useUser from "../../custom-hooks/useUser";
import jwt from "jsonwebtoken";
import { useDispatch } from "react-redux";
import { login } from "../../redux-slices/userSlice";
import instance from "../../lib/axiosConfig";
import BookmarkAddOutlined from "@mui/icons-material/BookmarkAddOutlined";

const Food = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState({});
  const [ingrident, setIngrident] = useState([]);
  const [step, setStep] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fav, setFav] = useState({});
  const [book, setBook] = useState({});
  const user = useUser();
  const dispatch = useDispatch();

  async function getOneRecipe(id) {
    const data = (
      await interceptAxios.get(`/recipe/getAuthenticatedOne/${id}`, {
        headers: {
          authorization: `Bearer ${user.accessToken}`,
        },
      })
    ).data;
    setRecipe(data.recipe);
    setIngrident(data.ingrident.name);
    setStep(data.step.name);
    setIsFetching(false);
    setFav(data.fav);
    setBook(data.book);
  }

  async function refreshToken() {
    try {
      const refresh = (
        await instance.post("auth/refresh", {
          refreshToken: user.refreshToken,
        })
      ).data;
      localStorage.setItem("accessToken", refresh.accessToken);
      dispatch(login());

      return refresh.accessToken;
    } catch (err) {
      console.log(err);
      throw Error("Error Occured");
    }
  }

  interceptAxios.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      const decodedToken = jwt.decode(user.accessToken);

      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        const data = await refreshToken();
        config.headers["authorization"] = "Bearer " + data;
      }

      return config;
    },
    (err) => Promise.reject(err)
  );

  useEffect(() => {
    if (router.query.foodId) {
      getOneRecipe(router.query.foodId);
    }
  }, [router.query]);

  return (
    <>
      <Head>
        <title>Detail Page</title>
      </Head>
      <div>
        <Navbar />
        {isFetching ? (
          <p>Loading...</p>
        ) : (
          <div className="min-h-screen max-w-[1024px] mx-auto flex justify-center">
            <div className="max-w-max mt-16 shadow-sm px-[8vw] flex flex-col lg:flex-row gap-4 justify-center lg:items-start items-center">
              <div className="border-gray-700 border-4 rounded-lg">
                <div className="relative h-[50vh] w-[80vw] lg:w-[40vw] ">
                  <Image src={recipe.photo} layout="fill" objectFit="cover" />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h5 className="font-extrabold text-xl text-center">
                  {recipe.name}
                </h5>
                <div className="w-[70vw] lg:w-[40vw] flex flex-col gap-2 justify-center items-center">
                  <h5 className="font-bold text-lg text-center">Ingridents</h5>

                  <ul className="grid grid-cols-2 gap-x-10">
                    {ingrident.map((ing, index) => {
                      return <li key={index}>* {ing}</li>;
                    })}{" "}
                  </ul>
                </div>
                <div className="w-[70vw] lg:w-[40vw] flex flex-col gap-2 justify-center items-center">
                  <h5 className="font-bold text-lg text-center">Steps</h5>

                  <ol className="grid grid-cols-2 gap-x-10">
                    {step.map((s, i) => {
                      return (
                        <li key={i}>
                          Step {++i}) {s}
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <div className="flex justify-center gap-4">
                  <div>
                    Add To Favorite
                    <IconButton>
                      {"  "}
                      {fav.isFav ? <Favorite /> : <FavoriteOutlined />}
                    </IconButton>
                  </div>
                  <div>
                    Add To Bookmark
                    <IconButton>
                      {book.isBook ? <Bookmark /> : <BookmarkAddOutlined />}
                    </IconButton>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <TextField variant="outlined" label="comment" />
                  <Button variant="outlined">Post</Button>
                </div>
                <div className="flex flex-col gap-4">
                  <p>Comments</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      <Avatar>E</Avatar>
                      <p className="text-gray-600">Eyob Abebe</p>
                    </div>
                    <p>That is Cool!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Food;
