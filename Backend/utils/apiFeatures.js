class APIFeatures {
 constructor(query, queryStr){
    this.query = query;
    this.queryStr = queryStr;
 } 
 search(){
    const keyword = this.queryStr.keyword ? {
        name:{
        $regex: this.queryStr.keyword,
        $options: 'i'
        }
    } :{}
    console.log(keyword)
     this.query = this.query.find({...keyword});
        return this
 }

   filter(){
      const queryCopy = {...this.queryStr};
       
        //Remove some feilds from query
     const removeFields = ['keyword', 'limit', 'page'];
     removeFields.forEach(el  => delete queryCopy[el]);
       //console.log(queryCopy)

     //Filter for price and ratings
     let queryStr = JSON.stringify(queryCopy);
     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // console.log(queryStr)

     this.query = this.query.find(JSON.parse(queryStr));
     return this
   }
   pagination(resPerpage){
     const currentPage = Number(this.queryStr.page) || 1;
      const skip =  resPerpage * (currentPage - 1) ;

      this.query = this.query.limit(resPerpage).skip(skip);
      return this
   }
}
module.exports = APIFeatures;