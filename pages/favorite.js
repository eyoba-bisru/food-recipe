import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Card from "../components/card";
import useLoggedOut from "../custom-hooks/useLoggedOut";
import interceptAxios from "../lib/axiosUserConfig";
import useUser from "../custom-hooks/useUser";
import jwt from "jsonwebtoken";
import { useDispatch } from "react-redux";
import { login } from "../redux-slices/userSlice";
import instance from "../lib/axiosConfig";
import jwtDecode from "jwt-decode";

export default function Favorite() {
  const isLoading = useLoggedOut();
  const [isFetching, setIsFetching] = useState(true);
  const user = useUser();
  const [favorites, setFavorites] = useState([]);
  const dispatch = useDispatch();

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
      //   throw Error("Error Occured");
    }
  }

  interceptAxios.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      const decodedToken = jwtDecode(localStorage.getItem("accessToken"));
      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        const data = await refreshToken();
        config.headers["authorization"] = "Bearer " + data;
      }

      return config;
    },
    (err) => Promise.reject(err)
  );

  useEffect(() => {
    (async () => {
      try {
        const favorite = await (
          await interceptAxios.get("/recipe/favorite", {
            headers: {
              authorization: `Bearer ${user.accessToken}`,
            },
          })
        ).data.recipes;
        setIsFetching(false);
        favorite.pop();
        setFavorites(favorite);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  if (isLoading) return <p>Loading...</p>;

  return (
    <>
      <Head>
        <title>Favorite page</title>
      </Head>
      <div>
        <Navbar />
        <div className="min-h-screen border flex justify-center">
          <div className="flex flex-col justify-center items-center border mt-14">
            <h2 className="text-2xl font-extrabold my-10">Favorite Dishes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 gap-4">
              {isFetching ? <p>Loading...</p> : ""}
              {favorites.length == 0 ? (
                <p>No Favorites Added</p>
              ) : (
                favorites.map((fav) => {
                  return (
                    <Card
                      key={fav._id}
                      name={fav.name}
                      calories={fav.calories}
                      time={fav.timeInMin}
                      person={fav.numOfPerson}
                      photo={fav.photo}
                      id={fav._id}
                    />
                  );
                })
              )}
              {/* <Card />
              <Card />
              <Card />
              <Card />
              <Card />
              <Card /> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
