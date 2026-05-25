import axios from "axios";

export const translateText = async (
  text,
  targetLanguage
) => {
  try {
    const response = await axios.get(
      "https://translate.googleapis.com/translate_a/single",
      {
        params: {
          client: "gtx",
          sl: "auto",
          tl: targetLanguage,
          dt: "t",
          q: text,
        },
      }
    );

    return response.data[0][0][0];
  } catch (error) {
    console.log(error);

    return text;
  }
};