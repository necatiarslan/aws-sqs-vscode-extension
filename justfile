package:
    vsce package
    mv *.vsix ./vsix/

build:
    vsce package
    mv *.vsix ./vsix/

publish:
    vsce publish

npm-doctor:
    npm doctor # check dependencies
    npm prune # remove unused dependencies
    npx depcheck # check dependencies
    npm-check # check dependencies


npm-outdated:
    npm outdated
    npx npm-check-updates
    
npm-update:
    npm update

npm-install:
    rm -rf node_modules package-lock.json
    npm install
    npx tsc --noEmit

list-topics:
    aws --endpoint-url=http://localhost:4566 sns list-topics

add-topic:
    aws --endpoint-url=http://localhost:4566 sns create-topic --name my-topic

add-subscription:
    aws --endpoint-url=http://localhost:4566 sns subscribe --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic --protocol email --notification-endpoint abc@example.com
    aws --endpoint-url=http://localhost:4566 sns subscribe --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic --protocol email --notification-endpoint asd@example.com
    aws --endpoint-url=http://localhost:4566 sns subscribe --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic --protocol sqs --notification-endpoint arn:aws:sqs:us-east-1:000000000000:my-queue

remove-subscriptions:
    aws --endpoint-url=http://localhost:4566 sns list-subscriptions-by-topic --topic-arn "arn:aws:sns:us-east-1:000000000000:my-topic" --query "Subscriptions[?SubscriptionArn!='PendingConfirmation'].SubscriptionArn" --output text | xargs -I {} aws --endpoint-url=http://localhost:4566 sns unsubscribe --subscription-arn "{}"

list-subscriptions:
    aws --endpoint-url=http://localhost:4566 sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic