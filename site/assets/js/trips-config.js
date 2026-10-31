/* Shivaya Prakriti: settings for the mountain trips page.
   This is the only file the founder (or a developer) edits to switch things on. */
window.SP_TRIPS = {

  /* The WhatsApp number that receives trip enquiries.
     Leave it empty until the founder supplies the business number.
     While it is empty the enquiry form only checks answers: it opens nothing,
     sends nothing, and says so on the page.

     To activate: country code first, digits only, no plus sign, spaces or dashes.
     For example "919876543210" for an Indian number. */
  whatsappNumber: "",

  /* Photos and videos for the media sections on trips.html.
     Each list starts empty, which shows a clearly labelled empty slot.
     Put files in assets/media/trips/ and add an entry such as:

       { type: "image", src: "assets/media/trips/room-1.jpg", width: 1800, height: 1200,
         alt: "Describe what the photo actually shows.", caption: "Optional caption" }

       { type: "video", src: "assets/media/trips/walk.mp4", poster: "assets/media/trips/walk.jpg",
         alt: "Describe what the video shows.", caption: "Optional caption" }

     Add  preview: true  to anything that is a stand-in and not the real place.
     It is then badged "Preview media, not the actual place" on the page.
     Real media needs no flag. */
  media: {
    destination: [],
    properties: [],
    rooms: [],
    meals: [],
    activities: []
  }
};
