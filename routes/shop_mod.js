router.get('/', async (req, res, next)=>{
    if (req.user){
        const userId = await req.user.id;
        const user = await User.findOne({
        where:{
            id:userId
        },
        include: [Order]
        });
        let orders = [];
        user.orders.forEach(order=>{
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        orders.push(order.productIds.split(","));
        orders = [].concat.apply([], orders);
        orders = orders.filter(onlyUnique);
        });
    }   
}); 